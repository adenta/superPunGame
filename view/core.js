var host = "https://obscure-hollows-3603.herokuapp.com";
var toast = function(msg) {
  Materialize.toast(msg, 4000)
};
var app = angular.module('myApp', []);
app.controller('mainWindow', function($scope) {
  $scope.$on('$viewContentLoaded', function() {

  });
  $scope.parent = {};
  $scope.parent.title = "Login";

  $scope.parent.showCreate = true;
  $scope.parent.showPun = false;
  $scope.parent.showAdmin = false;
  $scope.parent.usrs = {
    contents: []
  };
  $scope.pictureUrl = "";
  $scope.judge = "judge";
  $scope.toggleCreate = function() {
    if ($scope.parent.showCreate) {
      $scope.parent.title = "Create";
    } else {
      $scope.parent.title = "Login";
    }
    $scope.parent.showCreate = !$scope.parent.showCreate;

  };
});

app.controller('login', function($scope, $http) {
  $scope.login = function() {
    $http.post(host + "/api/authenticate", {
        name: $scope.name,
        password: $scope.password
      })
      .then(function successCallback(response) {
        toast(response.data.message);

        $scope.token = response.data.token;
        $http({
            url: host + "/api/roomInfo/",
            method: "POST",
            data: {
              token: $scope.token,
              name: $scope.name
            }
          })
          .then(function successCallback(res) {
            $scope.pictureUrl = res.data.room.url;
            console.log(res.data);
            if (res.data.view == "public") {
              $scope.judge = res.data.room.judge;
              $scope.score = res.data.score;

              $scope.parent.title = "Submit a pun.";
              $scope.parent.showPun = true;
              $scope.parent.showAdmin = false;

            } else {
              console.log(res.data);
              $scope.parent.title = "Select a winner.";
              $scope.usrs = res.data.contents;
              $scope.parent.showAdmin = true;
              $scope.parent.showPun = false;

            }
          }).then(function errCallback(err) {
            if (err) {
              toast(err.message);
              alert("error: " + err)
            }
          });
      }).then(function errCallback(err) {
        if (err) {
          toast(err.message);
          alert("error: " + err)
        }
      });
  };
  $scope.submitPun = function() {
    $http.post(host + "/api/submitPun", {
        token: $scope.token,
        name: $scope.name,
        pun: $scope.pun
      })
      .then(function successCallback(response) {
        toast(response.data.message);
        console.log(response.data);
      });

  };
  $scope.selectWinner = function(x) {
    console.log(x.name);
    $http.post(host + "/api/selectWinner", {
        token: $scope.token,
        selectedName: x.name
      })
      .then(function successCallback(response) {
        toast(response.data.message);
        console.log(response.data);
        if (response.data.status == "OK") {
          $scope.login();

        }
      });

  };

});



app.controller('create', function($scope, $http) {
  $scope.create = function() {
    $http.post(host + "/setup", {
        name: $scope.name,
        password: $scope.password,
        first: $scope.first,
        last: $scope.last,
        phone: $scope.phone,
      })
      .then(function successCallback(response) {
        toast(response.data.message);
      })
      .then(function errCallback(err) {
        if (err) {
          toast(err.message);
          alert("error: " + err)
        }
      });
  };


});
