!function() {
	var app = angular.module('IncidentForm',[]); 

	app.factory('Validator',function(){
		return {
			create:function(field,validate) {
				app.directive(field,function () {
					var isValid = validate;
					return {
						require:'ngModel',
						link:function (scope, elm, attrs, ngModelCtrl) {
							ngModelCtrl.$parsers.unshift(function (viewValue) {
								ngModelCtrl.$setValidity('strongPass', isValid(viewValue));
								return viewValue;
							});

							ngModelCtrl.$formatters.unshift(function (modelValue) {
								ngModelCtrl.$setValidity('strongPass', isValid(modelValue));
								return modelValue;
							});
						}
					};
				});
			}
		}
	});
	
	var inj = angular.injector(['IncidentForm','ng']);
	var validator = inj.get('Validator');
	
	validator.create('valDate',function(v){
		var re = /^(0[0-9]|1[0-2])\/([0-2][0-9]|3[0-1])\/(20[1-9][4-9]) (0[0-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
		if(re.test(v)) return true;
		return false;
	});
	
	validator.create('valName',function(v){
		var re = /^[A-Za-z\sа-яА-ЯіІїЇҐґ]+$/;
		if(re.test(v)) return true;
		return false;
	});
	
	validator.create('valSelect',function(v){
		if(isNaN(+v)) return true;
		return false;
	});
	
	validator.create('valPhone',function(v){
		var re = /^[0-9]{3}.[0-9]{3}.[0-9]{4}$/;
		if(re.test(v)) return true;
		return false;
	});
	
	validator.create('valTextarea',function(v){
		v = encodeURI(v);
		if(!v) return false;
		return true;
	});
	
	var ctrls = {
		generalTab:['$scope',function($scope){
			$scope.general = {};
			
			$scope.general.companyReporter = {
				current:'0',
				data:[
					{title:'Company A'},	
					{title:'Company B'},	
					{title:'Company C'},	
					{title:'Company D'}
				]
			};

			$scope.general.wellNumber = {
				current:'0',
				data:[
					{well:'Well-01',Region:'South',State:'Oklahoma','Field Office':'Ringwood'},	
					{well:'Well-02',Region:'North',State:'Montana','Field Office': 'Sidney'},	
					{well:'Well-03',Region:'North',State:'North Dakota','Field Office':'Tioga'}	
				],
				getByWell:function(well){
					return this.data.filter(function(obj) {
						return (obj.well == well);
					})[0];		
				}
			};
			
			$scope.general.severity = {
				data:[
					{severity:'Loss well controll',apply:0},
					{severity:'Fatality(ies)',apply:0},
					{severity:'Hospitalization or medical treatment',apply:0},
					{severity:'Spill offsite > 50 Dbls',apply:0},
					{severity:'Spill to water, any amount',apply:0},
					{severity:'Property damage',apply:0}
				],
				uncheck:0,
				resetAll:function(){
					if(!!this.uncheck)
						this.data.forEach(function(obj){
							obj.apply = false;
						});
				}
			}
		}],

		correctiveTab:['$scope','$rootScope',function($scope,$rootScope){
			$scope.corrective = {};
			$scope.corrective.actions = {};
			$scope.corrective.count = 0;
			$scope.corrective.max = 5;

			$scope.corrective.companyReporter =
				angular.copy($rootScope.$$childHead.general.companyReporter);

			$scope.corrective.editAction = function(){
				var action = $('#correctiveActionTb').bootstrapTable('getSelections');
				if(action.length === 0) return;

				$('#correctiveActionForm').modal('show');
				action = action[0];
				
				$scope.corrective.state='edit';
				$scope.corrective.ID = action.id;
				$scope.corrective.descrCA = action.descrCA;
				$scope.corrective.takenBy = action.takenBy;
				$scope.corrective.companyReporter.current = action.company;
				$scope.corrective.date = action.date;

			};

			$scope.corrective.removeAction = function(){
				var selects = $('#correctiveActionTb').bootstrapTable('getSelections'),
		            ids = $.map(selects, function (row) { return row.id; });
		        
		        if(ids[0] in $scope.corrective.actions)
		        		delete $scope.corrective.actions[ids[0]]; 
		        
		        $('#correctiveActionTb').bootstrapTable('remove',{field:'id',values:ids});
		        if($scope.corrective.count > 0) --$scope.corrective.count;
			};

			$scope.corrective.addAction = function(){
				if($scope.corrective.count >= 5) {

					return;
				}
				$scope.corrective.state='add';
				delete $scope.corrective.ID;
				$('#correctiveForm')[0].reset();
				$('#correctiveActionForm').modal('show');
			};

			$scope.corrective.getTitle = function(){
				switch($scope.corrective.state){
					case 'add': return 'Add Action';
					case 'edit': return 'Edit Action';
				} 
			};

			$scope.corrective.saveAction = function(){
				var id = $scope.corrective.ID || generateID();

				$scope.corrective.actions[id] = {
					id:id,
					state:false,
					descrCA:$scope.corrective.descrCA,
					takenBy:$scope.corrective.takenBy,
					company:$scope.corrective.companyReporter.current,
					date:$scope.corrective.date
				};

				var actions = [];
				angular.forEach($scope.corrective.actions,function(value){ this.push(value); },actions);
				$scope.corrective.count = actions.length;
				$('#correctiveActionTb').bootstrapTable('load',actions);

				$('#correctiveActionForm').modal('hide');
			};
		}],

		tableStyle:['$scope','$window',function($scope, $window){
			$window.zebraRows = function(row, index) {
			    if (index % 2 === 0) {
			        return {classes: arguments.callee.cls};
			    }
			    return {};
			};
			
			$scope.zebra = function(cls){
				$window.zebraRows.cls = cls;
			};	
		}]
	};
	
	for(var i in ctrls)
		app.controller(i,ctrls[i]);	


	function generateID() {
		return ''+new Date().valueOf()+parseInt(Math.random()*10000000000,10);
	}

	$(document).ready(function () {
	    $(".form_datetime").datetimepicker({
			format: "mm/dd/yyyy HH:ii P",
			showMeridian: true,
			autoclose: true,
			todayBtn: true
		});

		
		$('#incFormTabs a').click(function (e) {
		  e.preventDefault()
		  $(this).tab('show')
		});

		$('#correctiveActionTb').bootstrapTable().on('click-row.bs.table', function (e, row, $element) {
			$element.find('.bs-checkbox input:radio').click();
		});
		
	});
}();