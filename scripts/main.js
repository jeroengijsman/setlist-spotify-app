$(function () {
	$("#searchButton").live("click", function(event){
		event.preventDefault();
        $.ajax({
            type: "GET",
            url: "http://api.setlist.fm/rest/0.1/search/artists.json?artistName=" + $("#searchField").val(),
            success: function (data, textStatus, jqXHR) {
        		alert(data.artists.artist[0]["@name"]);
            },
            error: function (data) {
            	alert("Error");
            }
        });		
	});   
});