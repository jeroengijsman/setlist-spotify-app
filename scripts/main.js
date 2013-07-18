var Setlist = {

    Models: null,
    Search: null,
    List: null,
    playlistUri: null,
    playlistView: null,

    init: function(Models, Search, List) {
        Setlist.Models = Models;
        Setlist.Search = Search;
        Setlist.List = List;

        $("#searchButton").live("click", function(event) {
            event.preventDefault();
            Setlist.search();
        });

        Setlist.Models.Playlist.createTemporary(Date.now()).done(function(playlist) {    
            playlistUri = playlist.uri;
        });
    },

    search: function() {
        var query = $("#searchField").val();
        var songs = [];

        $.get("http://api.setlist.fm/rest/0.1/search/setlists.json?p=1&artistName=" + query, function(data) {

            console.log(data);

            Setlist.clear();
            $('#searchResult').empty();

            for(i=0;i<data.setlists.setlist.length;i++) {
            //data.setlists.setlist.forEach(function(setlist) {
                var setlist = data.setlists.setlist[i];
                
                if(setlist.sets != "")
                {
                    $('#searchResult').append("<li><a href=\"" + setlist.url + "\">" + setlist.url + "</a></li>");
                    console.log(setlist);
                    var setlistId = setlist["@versionId"];
                    var artist = setlist.artist["@name"];

                    if(setlist.sets.set.length != null) {
                        setlist.sets.set.forEach(function(set) {
                            songs = $.merge(songs, set.song);
                        });
                    }
                    else {
                        songs = setlist.sets.set.song;
                    }

                    Setlist.getSpotifyTracks(artist, songs);

                    break;
                }                
            //});
            };
        });
    },

    getSpotifyTracks: function(artist, songs) {
        var result = Setlist.Search.search(artist + " " + songs[0]["@name"]);
        console.log(artist + " " + songs[0]["@name"]);

        result.tracks.snapshot(0, 1).done(function(snapshot) {
            snapshot.loadAll('name').done(function(tracks) {
                if(tracks.legth != 0) {
                    tracks.forEach(function(track) {
                        Setlist.addTracktoPlaylist(track.uri);
                        console.log(songs[0]["@name"] + " : " + track.name + " - " + track.uri);                        
                    });
                }

                songs.splice(0,1);
                if(songs.length > 0) {
                    Setlist.getSpotifyTracks(artist ,songs);
                }
                else {
                    Setlist.showSpotifyPlaylist();
                }

            });
        });  
    },

    showSpotifyPlaylist: function(){
        document.getElementById('playlistContainer').appendChild(playlistView.node);
        playlistView.init();
    },

    addTracktoPlaylist: function(trackUri) {
        Setlist.Models.Playlist.fromURI(playlistUri).load("tracks").done(function(playlist){
            playlist.tracks.add(Setlist.Models.Track.fromURI(trackUri));
            playlistView = Setlist.List.forPlaylist(playlist);
        });
    },

    clear: function() {
        $('#playlistContainer').empty();
        Setlist.playlistView = null;
        Setlist.Models.Playlist.fromURI(playlistUri).load("tracks").done(function(playlist){
            playlist.tracks.clear();
        });
    }
};

require([
  '$api/models',        
  '$api/search#Search',
  '$views/list#List'
], function(Models, Search, List) {

    Setlist.init(Models, Search, List);
});