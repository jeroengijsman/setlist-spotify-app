var Setlist = {
    __models: null,
    __search: null,
    __list: null,
    __tracklist: [],

    init: function(models, Search, List) {
        $("#searchButton").live("click", function(event){
            event.preventDefault();

            __models = models;
            __search = Search;
            __list = List;

            Setlist.search();
        });    
    },

    search: function() {
        $.get("http://api.setlist.fm/rest/0.1/search/setlists.json?p=1&artistName=" + $("#searchField").val(), function(data) {
            var epicplaylist;

            document.getElementById('searchResult').innerHtml = "";
            console.log(document.getElementById('searchResult'));
            $.each(data.setlists.setlist, function(index, setlist) {
                var setlistId = setlist["@versionId"];
                var artist = setlist.artist["@name"];
                $("#searchResult").append("<li id=\"" + setlistId + "\">" 
                    + setlist["@eventDate"] + " - " 
                    + setlist["@tour"] + " - "
                    + setlist.venue["@name"] + "</li>")

                $("#" + setlistId).append("<ul id=\"setlist-" + setlistId + "\"></ul>");

                if(setlist.sets.set.length != null) {
                    setlist.sets.set.forEach(function(set) {
                        Setlist.getTracks(setlistId, artist, set);
                    });
                }
                else {
                    Setlist.getTracks(setlistId, artist, setlist.sets.set);
                }

                var temp = __models.Playlist.createTemporary(Date.now()).done(function(playlist){

                        // get tracks collection and add tracks to it
                        playlist.load(['tracks']).done(function(){
                            for (var i = 0; i < Setlist.__tracklist.length; i++) {
                                playlist.tracks.add(Setlist.__tracklist[i]);
                            }
                        });

                        epicplaylist = playlist;

                    }).fail(function() {
                        console.log("Failed");
                    });                                            
                return false;
            });

            var list = __list.forPlaylist(epicplaylist);
            document.getElementById('playlistContainer').innerHtml = "";
            document.getElementById('playlistContainer').appendChild(list.node);
            list.init();
        })
        .fail(function(data) { alert("error"); });
    },

    getTracks: function(setlistId, artist, set) {        
        set.song.forEach(function(song) {
            var result = __search.search(artist + " " +song["@name"]);
            result.tracks.snapshot(0, 1).done(function(snapshot) {
                snapshot.loadAll('name').done(function(tracks) {
                    tracks.forEach(function(track) {
                        Setlist.__tracklist.push(track);                        
                        $("#setlist-" + setlistId).append("<li>" + song["@name"] + " : " + track.name + " - " + track.uri + "</li>");
                    });
                });
            });
        });
    }
};


$(function () {
    require([
      '$api/models',        
      '$api/search#Search',
      '$views/list#List'
    ], function(models, Search, List) {
      Setlist.init(models, Search, List);
    });
});