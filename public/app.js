  
document.addEventListener("DOMContentLoaded", function() {
  $(document).on("click", "p", function() {
    $("#notes").empty();
    var thisId = $(this).attr("data-id");
  
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
      .then(function(data) {
        console.log(data);
        $("#notes").append("<h2>" + data.title + "</h2>");
        $("#notes").append("<input id='titleinput' name='title' >");
        $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
        $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
  
        if (data.note) {
          $("#titleinput").val(data.note.title);
          $("#bodyinput").val(data.note.body);
        }
      });
  });
  
  $(".saveButton").on("click", function() {
    console.log("Detecto clic en save")
    var thisId = $(this).attr("data-id");
  
    $.ajax({
      method: "POST",
      url: "/saveArticle/" + thisId,
      data: {
      }
    })
      .then(function(data) {
        console.log(data);
        $("#exampleModalCenter").modal({show: true})
      });
  
    $("#titleinput").val("");
    $("#bodyinput").val("");
  });

  $(".unsaveButton").on("click", function() {
    console.log("Detecto clic en unsave")
    var thisId = $(this).attr("data-id");
  
    $.ajax({
      method: "POST",
      url: "/unsaveArticle/" + thisId,
      data: {
      }
    })
      .then(function(data) {
        console.log(data);
        location.reload();
      });
  
    $("#titleinput").val("");
    $("#bodyinput").val("");
  });


});