angular.module('angularPayments')

.directive('stripeForm', ['$window', '$parse', 'Common', function($window, $parse, Common) {

  // directive intercepts form-submission, obtains Stripe's cardToken using stripe.js
  // and then passes that to callback provided in stripeForm, attribute.

  // data that is sent to stripe is filtered from scope, looking for valid values to
  // send and converting camelCase to snake_case, e.g expMonth -> exp_month


  // filter valid stripe-values from scope and convert them from camelCase to snake_case
  _getDataToSend = function(data){

    var possibleKeys = ['number', 'expMonth', 'expYear',
                    'cvc', 'name','addressLine1',
                    'addressLine2', 'addressCity',
                    'addressState', 'addressZip',
                    'addressCountry']

    var camelToSnake = function(str){
      return str.replace(/([A-Z])/g, function(m){
        return "_"+m.toLowerCase();
      });
    }

    var ret = {};

    for(i in possibleKeys){
        if(data.hasOwnProperty(possibleKeys[i])){
            ret[camelToSnake(possibleKeys[i])] = angular.copy(data[possibleKeys[i]]);
        }
    }

    ret['number'] = (ret['number'] || '').replace(/ /g,'');

    return ret;
  }

  return {
    restrict: 'A',
    link: function(scope, elem, attr) {

      // Disabling sanity check because we load the Stripe lib on demand. 
      /*
      if(!$window.Stripe){
          throw 'stripeForm requires that you have stripe.js installed. Include https://js.stripe.com/v2/ into your html.';
      }
      */

      var form = angular.element(elem),
        expMonthUsed,
        expYearUsed,
        exp,
        isSubmitting = false;

      form.bind('submit', function() {
        if (isSubmitting) {
          return;
        }

        isSubmitting  = true;

        expMonthUsed = scope.expMonth ? true : false;
        expYearUsed = scope.expYear ? true : false;

        if(!(expMonthUsed && expYearUsed)){
          exp = Common.parseExpiry(scope.expiry)
          scope.expMonth = exp.month
          scope.expYear = exp.year
        }

        var button = form.find('button');
        //button.prop('disabled', true);

        if (attr.preSubmit !== null && scope[attr.preSubmit]) {
          scope[attr.preSubmit].apply(scope);
        }

        if(form.hasClass('ng-valid')) {

          $window.Stripe.createToken(_getDataToSend(scope), function() {
            isSubmitting = false;

            var args = arguments;
            scope.$apply(function() {
              scope[attr.stripeForm].apply(scope, args);
            });
            //button.prop('disabled', false);
          });

        } else {
          isSubmitting = false;

          scope.$apply(function() {
            scope[attr.stripeForm].apply(scope, [400, {error: 'Invalid form submitted.'}]);
          });
          //button.prop('disabled', false);
        }

        scope.expMonth = null;
        scope.expYear  = null;
      });
    }
  }
}]);
