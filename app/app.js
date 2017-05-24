'use strict';
// TODO: once the app will have more than one template then move controller's code to separate component

// Define the `paintedGridApp` module
var paintedGridApp = angular.module('paintedGridApp', []);

// Define the `PaintedGridController` controller on the `paintedGridApp` module
paintedGridApp.controller('PaintedGridController', ['$scope', '$http',
  function PaintedGridController($scope, $http) {

    $scope.dragSrcEl = null;
    $scope.dropSrcEl = null;

    $scope.btnReset = document.querySelector('.control-wrapper .btn-reset');
    $scope.btnSave = document.querySelector('.control-wrapper .btn-save');
    $scope.btnLoad = document.querySelector('.control-wrapper .btn-load');
    $scope.paintedGridJson = document.querySelector('.json-wrapper');

    $scope.buttonsEvents = attachButtonsEvents();
    $scope.paintingGrid = createPaintingGrid();

    $http.get('/colors.json').then(function(response) {
      $scope.colors = response.data;

      angular.element(document).ready(function () {
        $scope.draggableColors = document.querySelectorAll('.palette-wrapper .color');
        $scope.droppedColors = document.querySelectorAll('.grid-wrapper li');
        $scope.dragnDropEvents = attachDragnDropEvents();
      });
    });

    function attachButtonsEvents() {
      $scope.btnReset.addEventListener('click', resetGrid, false);
      $scope.btnSave.addEventListener('click', savePaintedGrid, false);
      $scope.btnLoad.addEventListener('click', loadStoredGrid, false);
    }

    function attachDragnDropEvents() {
      for (var i = 0; i < $scope.draggableColors.length; i++) {
        $scope.draggableColors[i].addEventListener('dragstart', handleDragStart, false);
        $scope.draggableColors[i].addEventListener('dragenter', handleDragEnter, false);
        $scope.draggableColors[i].addEventListener('dragover', handleDragOver, false);
        $scope.draggableColors[i].addEventListener('dragleave', handleDragLeave, false);
        $scope.draggableColors[i].addEventListener('dragend', handleDragEnd, false);
      }

      for (var j = 0; j < $scope.droppedColors.length; j++) {
        $scope.droppedColors[j].addEventListener('dragenter', handleDragEnter, false);
        $scope.droppedColors[j].addEventListener('dragover', handleDragOver, false);
        $scope.droppedColors[j].addEventListener('dragleave', handleDragLeave, false);
        $scope.droppedColors[j].addEventListener('drop', handleDrop, false);
      }
    }

    // used in template to make an empty grid dynamically
    function createPaintingGrid() {
      var boxesAmount = 100,
        classAlias = 'grid-box-',
        boxesArr = [];

      for (var i = 1; i <= boxesAmount; i++) {
        boxesArr[i-1] = classAlias + i;
      }

      return boxesArr;
    }

    function handleDragStart(e) {
      $scope.dragSrcEl = this;

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.attributes[1].value);
    }

    function handleDragOver(e) {
      e.preventDefault();

      e.dataTransfer.dropEffect = 'move';

      return false;
    }

    function handleDragEnter(e) {
      this.classList.add('over');
    }

    function handleDragLeave(e) {
      this.classList.remove('over');
    }

    function handleDrop(e) {
      $scope.dropSrcEl = this;
      var styleAttr = this.children[0].attributes[1];

      e.preventDefault();

      if (styleAttr.value === '' || styleAttr.value === ' ') {
        styleAttr.value = e.dataTransfer.getData('text/html');
      } else {
        styleAttr.value = blendColors();
      }

      // once grid is not empty show the json representation of that
      showPaintedGridAsJson();

      return false;
    }

    function handleDragEnd(e) {
      for (var i = 0; i < $scope.droppedColors.length; i++) {
        $scope.droppedColors[i].classList.remove('over');
      }
    }

    function blendColors() {
      var blendingColor = parseColor($scope.dragSrcEl.attributes[1].value),
        changeableColor = parseColor($scope.dropSrcEl.children[0].attributes[1].value),
        newColor = [],
        newStyleAttr = '',
        roundedColor;

      for (var i = 0; i < blendingColor.length; i++) {
        roundedColor = Math.round(parseFloat((+blendingColor[i] + +changeableColor[i]) / 2));
        newColor.push(roundedColor);
      }

      newStyleAttr = 'background-color: rgb(' + newColor.join(', ') + ')';

      return newStyleAttr;
    }

    function parseColor(color) {
      var slicedStr = '',
        splitedStr = [];

      slicedStr = color.slice(color.indexOf('(') + 1, color.indexOf(')'));
      splitedStr = slicedStr.split(', ');

      return splitedStr;
    }

    function showPaintedGridAsJson() {
      var json;

      json = createPaintedGridJson();

      for (var i = 0; i < json.length; i++) {
        if (json[i] == '' || json[i] == ' ') {
          json[i] = '"' + i + '": "empty"';
        } else {
          json[i] = '"' + i + '": "' + json[i] + '"'
        }
      }

      json = '{' + json.join(',\n') + '}';
      $scope.paintedGridJson.innerHTML = json;
    }

    function resetGrid() {
      for (var i = 0; i < $scope.droppedColors.length; i++) {
        if ($scope.droppedColors[i].children[0].attributes[1].value === '') {
          continue;
        } else {
          $scope.droppedColors[i].children[0].attributes[1].value = '';
        }
      }
      // also remove the json representation from the page
      $scope.paintedGridJson.innerHTML = '';
    }

    // TODO: replace all the alerts with custom well designed pop-ups
    function savePaintedGrid() {
      if (checkGridIsNotEmpty() === false) {
        alert('Nothing to save!');
        return;
      } else {
        setGridToLocalStorage();
      }
    }

    function checkGridIsNotEmpty() {
      var result;

      for (var i = 0; i < $scope.droppedColors.length; i++) {
        if ($scope.droppedColors[i].children[0].attributes[1].value !== '') {
          result = true;
          break;
        }
        result = false;
      }

      return result;
    }

    function setGridToLocalStorage() {
      var currentStorageLength = localStorage.length,
        grid;

      // prepare data to it be able to set them to local storage
      grid = createPaintedGridJson();

      if (checkLocalStorageSpace() === true) {
        try {
          localStorage.setItem('painted-grid-' + currentStorageLength, grid);
          alert('Data were succesfully saved.');
        } catch(e) {
          alert('Unfortunately, size of data is bigger than available space in storage.');
        }
      } else {
        alert('Storage is full!');
      }
    }

    function createPaintedGridJson() {
      var json = [];

      for (var i = 0; i < $scope.droppedColors.length; i++) {
        if ($scope.droppedColors[i].children[0].attributes[1].value === ' ') {
          $scope.droppedColors[i].children[0].attributes[1].value = '';
        }
        json.push($scope.droppedColors[i].children[0].attributes[1].value);
      }

      return json;
    }

    function checkLocalStorageSpace() {
      var test = 'test';

      try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch(e) {
        return false;
      }
    }

    function loadStoredGrid() {
      var parsedGrid;

      parsedGrid = parseStoredGrid();

      if (parsedGrid !== null) {
        for (var i = 0; i < $scope.droppedColors.length; i++) {
          $scope.droppedColors[i].children[0].attributes[1].value = parsedGrid[i];
        }
        // once grid is loaded also show its json representation
        showPaintedGridAsJson();
      } else {
        alert('Nothing to load!');
      }
    }

    function parseStoredGrid() {
      var storedGrid,
        parsedArr = [],
        target = ',',
        pos = -1,
        arrItem,
        firstItem;

      storedGrid = getGridFromLocalStorage();

      if (storedGrid !== null) {
        // parse and add first element of the grid
        if (storedGrid.charAt(0) === target) {
          firstItem = ' ';
        } else if (storedGrid.charAt(0) === 'b') {
          firstItem = storedGrid.slice(0, storedGrid.indexOf(')') + 1);
        }

        parsedArr.push(firstItem);
        // loop to parse rest elements of the grid except the first one
        while ((pos = storedGrid.indexOf(target, pos + 1)) != -1) {
          // exclude cases when ',' found inside rgb color
          if (storedGrid.charAt(pos + 1) === ' ') continue;
          // if the 'b' char found after the ',' then the element contains color
          if (storedGrid.charAt(pos + 1) === 'b') {
            arrItem = storedGrid.slice(pos + 1, storedGrid.indexOf(')', pos + 1) + 1);
          } else {
            arrItem = ' ';
          }
          parsedArr.push(arrItem);
        }

      } else {
        parsedArr = null;
      }

      return parsedArr;
    }

    // get the last saved grid from the local storage
    // TODO: make it possible to select the grid from the list of saved grids
    function getGridFromLocalStorage() {
      var currentStorageLength = localStorage.length,
        latestStoredGrid = 'painted-grid-' + (currentStorageLength - 1),
        result;

      if (currentStorageLength > 0) {
        result = localStorage.getItem(latestStoredGrid);
        // after the grid has gotten then delete it from the storage
        localStorage.removeItem(latestStoredGrid);
      } else {
        result = null;
      }

      return result;
    }

  }
]);
