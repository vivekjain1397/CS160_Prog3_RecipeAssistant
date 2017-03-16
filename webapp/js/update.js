$(document).ready(function() {
  // populate table with all database entries
  var theUrl = "https://lztxcr6zu1.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate?TableName=Recipes";
  var json_obj;
  var count;
  var recipe_name;
  var recipe_directions;
  $.when($.get(theUrl, function(data, status){
    json_obj = data;
    count = data.Count;
  })).then(function() {
    for (var i = 0; i < count; i++) {
      var whole_recipe = json_obj.Items[i];
      var name = whole_recipe.RecipeName;
      var directions = whole_recipe.Directions;
      var image = whole_recipe.Image;
      var ing = whole_recipe.Ingredients;
      var ct = whole_recipe.Count;
      // add element to table
      var html = "<div class='media recipe-list-item list-group-item container'>";
      html += "<div class='media-left'> <img class='media-object recipe-image img-responsive '";
      html += "src='" + image + "' alt='img'> </div>";
      html += "<div class='media-body container'>";
      html += "<h3 class='media-heading recipe-name'>";
      html += name + "</h3></div>";
      html += "<div class='media-right'>";
      html += "<img class='media-object recipe-icon img-responsive directions-icon'";
      html += " id='" + ct + "' src='img/directions.png' alt='alt'>";
      html += "<img class='media-object recipe-icon img-responsive ingredients-icon'";
      html += " id='" + ct + "' src='img/ingredients.png' alt='alt'>";
      html += "</div></div>";
      $(".recipe-list").append(html);
    }
  });
  $(".recipe-list").on('click', '.directions-icon', function() {
    var currId = $(this).attr('id');
    for (var i = 0; i < count; i++) {
      if (json_obj.Items[i].Count == currId) {
        // pass in recipe name to URL w/ directions.html
        recipe_name = json_obj.Items[i].RecipeName;
        window.location.href = "directions.html?name=" + recipe_name;
      }
    }
  });

  $(".recipe-list").on('click', '.ingredients-icon', function() {
    var currId = $(this).attr('id');
    for (var i = 0; i < count; i++) {
      if (json_obj.Items[i].Count == currId) {
        // pass in recipe name to URL w/ directions.html
        recipe_name = json_obj.Items[i].RecipeName;
        window.location.href = "ingredients.html?name=" + recipe_name;
      }
    }
  });


})


