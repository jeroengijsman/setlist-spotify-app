var Setlist = {

    Models: null,
    Search: null,
    List: null,
    Toplist: null,
    playlistUri: null,
    playlistView: null,
    topArtistImageList: [],

    init: function(Models, Search, List, Toplist) {
        Setlist.Models = Models;
        Setlist.Search = Search;
        Setlist.List = List;
        Setlist.Toplist = Toplist;

        var list = Setlist.Toplist.forCurrentUser();

        list.artists.snapshot().done(function(artists) {
            for (var i = 0; i < artists.length; i++) {
                Setlist.Models.Artist.fromURI(artists.get(i).uri).load('image').done(function(artist) {
                    Setlist.topArtistImageList.push(artist.imageForSize(420));
                });
            }
            $('#header img').attr("src", Setlist.topArtistImageList[0]);
        });

        $('#searchSetlist').submit(function(event) {
            Setlist.search();
            event.preventDefault();
        });

        var searchTimer;
        $('#searchField').keyup(function() {
            var query = $(this).val();
            clearTimeout(searchTimer);
            if(query.length > 3) {
                searchTimer = setTimeout(function() {
                    Setlist.searchSuggestions(query);
                }, 250);
            }
            else {
                $('#searchSuggestion').hide();
            }
        });

        Setlist.Models.Playlist.createTemporary(Date.now()).done(function(playlist) {    
            playlistUri = playlist.uri;
        });

        Setlist.changeWallpaper(1);
    },

    searchSuggestions: function(query) {
        $.get('http://search.musicbrainz.org/ws/3/artist/?query='+ query +'&fmt=json', function(data) {
            $('#searchSuggestion').show();
            $('#searchSuggestion').html('<li>' + data['artist-list'].artist[0].name + '</li>')
            console.log(data['artist-list'].artist[0]);
        });
    },

    changeWallpaper: function(nextWallpaper) {
        setTimeout(function()   { 
            $('#header img').fadeOut(function() {
                $('#header img').attr("src", Setlist.topArtistImageList[nextWallpaper]);
                $('#header img').fadeIn();
            });
            nextWallpaper++;
            if(nextWallpaper > Setlist.topArtistImageList.length)
                nextWallpaper = 0;

            Setlist.changeWallpaper(nextWallpaper);
         }, 6000);
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
  '$views/list#List',
  '$api/toplists#Toplist'
], function(Models, Search, List, Toplist) {

    Setlist.init(Models, Search, List, Toplist);
});