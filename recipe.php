<!DOCTYPE html>
<html>
  <head>
    <title>Recipe Assistant</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="assets/css/style.css"/>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
  </head>
  <body>
    <div class="recipe--container">
        <?php
          $json = file_get_contents('https://doitqrtbx7.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate?TableName=Recipes');
          $data = json_decode($json, true);

          foreach ($data['Items'] as $item) {
            echo $item['RecipeName'];
            echo "\r\n";
            echo $item['Directions'];
            echo "\r\n";
            echo $item['Ingredients'];
            echo "\r\n";
              echo $item['Image'];
          }
      ?>
    </div>
  </body>
</html>