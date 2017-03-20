// Populate directions page with correct image, directions, and ingredients from database

$(document).ready(function() {
  var theUrl = "https://doitqrtbx7.execute-api.us-east-1.amazonaws.com/prod/RecipeVUIandWebUI?TableName=Recipes";
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
    console.log(parsed.substring(0, 1).toUpperCase());
    console.log(parsed.substring(1));
    var html = "<h2>" + parsed + "</h2>";
    // grab correct data from DB
    for (var i = 0; i < count; i++) {
      if (json_obj.Items[i].RecipeName == parsed) {
        recipe_image = json_obj.Items[i].Image;
        recipe_ingredients = json_obj.Items[i].Ingredients;
        recipe_directions = json_obj.Items[i].Directions;
      }
    }
    var directions_split = recipe_directions.split("\n");
    var ingredients_split = recipe_ingredients.split("\n");
    html += "<img class='mx-auto directions-img' src='" + recipe_image + "' alt='alt'>";
    $(".all-directions").append(html);
    // make ingredients list
    var html2 = "<h3>Ingredients</h3>";
    html2 += "<ul class='list-group ingredient-list'>";
    $.each(ingredients_split, function(d) {
      html2 += "<li class='list-group-item'>" + ingredients_split[d]; + "</li>";
    })
    html2 += "</ul>";
    // make directions list
    var html3 = "<h3>Directions</h3>";
    html3 += "<ul class='list-group ingredient-list directions-list'>";
    $.each(directions_split, function(d) {
      html3 += "<li class='list-group-item'>" + directions_split[d]; + "</li>";
    })
    html3 += "</ul>";
    $(".all-directions").append(html2);
    $(".all-directions").append(html3);
  })
});

    