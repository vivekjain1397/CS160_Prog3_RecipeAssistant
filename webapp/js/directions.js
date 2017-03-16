$(document).ready(function() {
  var theUrl = "https://lztxcr6zu1.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate?TableName=Recipes";
  var recipe_image;
  var recipe_ingredients;
  var recipe_directions;
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
        recipe_image = json_obj.Items[i].Image;
        recipe_ingredients = json_obj.Items[i].Ingredients;
        recipe_directions = json_obj.Items[i].Directions;
      }
    }
    var directions_split = recipe_directions.split("\n");
    var ingredients_split = recipe_ingredients.split("\n");
    html += "<img class='mx-auto' src='" + recipe_image + "' alt='alt'>";
    $(".all-directions").append(html);
    // make an ingredients list
    var html2 = "<h2>Ingredients</h2>";
    html2 += "<ul class='list-group ingredient-list'>";
    $.each(ingredients_split, function(d) {
      html2 += "<li class='list-group-item'>" + ingredients_split[d]; + "</li>";
    })
    html2 += "</ul>";
    // make a directions list
    var html3 = "<h2>Directions</h2>";
    html3 += "<ul class='list-group ingredient-list'>";
    $.each(directions_split, function(d) {
      html3 += "<li class='list-group-item'>" + directions_split[d]; + "</li>";
    })
    html3 += "</ul>";
    $(".all-directions").append(html2);
    $(".all-directions").append(html3);
  })
});

    