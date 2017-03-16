$(document).ready(function() {
  var theUrl = "https://lztxcr6zu1.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate?TableName=Recipes";
  var recipe_ing;
  var json_obj;
  var count;
  $.when($.get(theUrl, function(data, status){
    json_obj = data;
    count = data.Count;
  })).then(function() {
    var query_name = window.location.search.substring(1);
    var parsed = decodeURIComponent((query_name+'').replace(/\+/g, '%20')).substring(5);
    console.log(parsed);
    var html = "<h1>" + parsed + "</h1>";
    // find directions
    for (var i = 0; i < count; i++) {
      if (json_obj.Items[i].RecipeName == parsed) {
        recipe_ing = json_obj.Items[i].Ingredients;
      }
    }
    var ing_split = recipe_ing.split("\n");
    $.each(ing_split, function(d) {
      html += "<li class='list-group-item'>" + ing_split[d]; + "</li>";
    })
    $(".ingredient-list").append(html);
  })
});

