$(document).ready(function(){
	var theUrl = "https://lztxcr6zu1.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate?TableName=Recipes";
	$("#post_button").click(function(){
    	$.post(theUrl, JSON.stringify({
            "type": "POST", 
            "data": {
                "TableName": "Recipes",
                //New item information to be posted 
                "Item": {
                    "RecipeName":"Test", 
                    "Ingredients": "2015",
                    "Directions": "do this"}}}), 
        function(data, status){
    		alert(status);
    	})
    });
})
