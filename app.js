//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//insert connection string here
mongoose.connect("connection_string");

const itemsSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true, "Please make sure a name is specified."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const firstItem = new Item ({
  name: "Your To-Do List"
});

const secondItem = new Item ({
  name: "Delete Unneeded Items"
});

const thirdItem = new Item ({
  name: "Add new ones"
});

const defaultItems = [firstItem, secondItem, thirdItem];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}).then(function(foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(function(){
        console.log("Data inserted")  // Success
      }).catch(function(error){
        console.log(error)      // Failure
      });;
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});  // Success
    }
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
  .then(function(foundList) {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      return list.save();
    } else {
      return foundList;
    }
  })
  .then(function(list) {
    res.render("list", { listTitle: list.name, newListItems: list.items });
  })
  .catch(function(error) {
    console.log(error);
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function(foundList) {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(function(updatedList) {
        res.redirect("/" + listName);
      })
      .catch(function(error) {
        console.log(error);
      });
  }
  
});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID)
      .then(function() {
        console.log("Item Deleted"); // Success
        res.redirect("/");
      })
      .catch(function(error) {
        console.log(error); // Failure
        res.redirect("/");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } }
    )
      .then(function(foundList) {
        if (foundList) {
          res.redirect("/" + listName);
        } else {
          res.redirect("/");
        }
      })
      .catch(function(error) {
        console.log(error);
        res.redirect("/");
      });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
