var Setlist = {
    __search: null,

    init: function(Search) {
        $("#searchButton").live("click", function(event){
            event.preventDefault();
            __search = Search;
            Setlist.search();
        });    
    },

    search: function() {
        $.get("http://api.setlist.fm/rest/0.1/search/setlists.json?p=1&artistName=" + $("#searchField").val(), function(data) {
            $.each(data.setlists.setlist, function(index, setlist) {
                var setlistId = setlist["@versionId"];
                var artist = setlist.artist["@name"];
                $("#searchResult").append("<li id=\"" + setlistId + "\">" 
                    + setlist["@eventDate"] + " - " 
                    + setlist["@tour"] + " - "
                    + setlist.venue["@name"] + "</li>")

                $("#" + setlistId).append("<ul id=\"setlist-" + setlistId + "\"></ul>")

                setlist.sets.set.forEach(function(item) {
                    item.song.forEach(function(songitem) {
                        var result = __search.search(artist + " " +songitem["@name"]);

                        result.tracks.snapshot(0, 1).done(function(snapshot) {
                            snapshot.loadAll('name').done(function(tracks) {
                              tracks.forEach(function(track) {
                                $("#setlist-" + setlistId).append("<li>" + songitem["@name"] + " : " + track.name + " - " + track.uri + "</li>");
                              });
                            });
                        });                            
                    })
                })
                return false;
            });
        })
        .fail(function(data) { alert("error"); });
    }
};


$(function () {
    require([
      '$api/search#Search'
    ], function(Search) {
      Setlist.init(Search);
    });
});