import Search from "./models/Search";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/**
 * SEARCH CONTROLLER
 */

const controlSearch = async () => {
  // 1.Get query from view
  const query = searchView.getInput();
  if (query) {
    // 2. new Search Object and add to state
    state.search = new Search(query);
    //3. pREPARE UI for result
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      //4. Search for recipe
      await state.search.getResults();
      clearLoader();
      //Diplay the results
      searchView.renderResults(state.search.result);
    } catch (err) {
      alert("something wrong with the search...");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPage.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
  //Get ID from Url
  const id = window.location.hash.replace("#", "");

  if (id) {
    recipeView.clearRecipe();
    // Prepare UI for changes
    renderLoader(elements.recipe);

    //Highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    //create new recipe object
    state.recipe = new Recipe(id);

    try {
      //Get recipe  data
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      //Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (err) {
      alert("Error processing recipe!");
      clearLoader();
    }
  }
};

["hashchange", "load"].forEach(el =>
  window.addEventListener(el, controlRecipe)
);

/**
 * LIST CONTROLLER
 */
const controlList = () => {
  // Create a new list if there in none yet
  if (!state.list) state.list = new List();

  // ADD each ingredient to the list
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// Handle delete and update list item events
elements.shopping.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  // Handle delete button
  if (e.target.matches(".shopping__delete,.shopping__delete *")) {
    //Delete from state
    state.list.deleteItem(id);
    //Delete from ui
    listView.deleteItem(id);
  } else if (
    e.target.matches(".shopping__count-value,.shopping__count-value *")
  ) {
    const value = parseFloat(e.target.value, 10);
    state.list.updateCount(id, value);
  }
});

/**
 * LIKE CONTROLLER
 */

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  if (!state.likes.isLiked(currentID)) {
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    likesView.toggleLikeBtn(true);
    likesView.renderLike(newLike);
  } else {
    state.likes.deleteLike(currentID);
    likesView.toggleLikeBtn(false);
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//
window.addEventListener("load", () => {
  state.likes = new Likes();
  state.likes.readStorage();
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add,recipe__btn *")) {
    controlList();
  } else if (e.target.matches(".recipe__love,.recipe__love *")) {
    //Like controller
    controlLike();
  }
});
