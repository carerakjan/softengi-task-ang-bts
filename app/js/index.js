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
		var re = /^(0[0-9]|1[0-2])\/([0-2][0-9]|3[0-1])\/(20[1-9][4-9]) (0[0-9]|1[1-2]):([0-5][0-9]) (AM|PM)$/;
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
		v = encodeURI(v);console.log(v);
		if(!v) return false;
		return true;
	})
	
	var ctrls = {
		generalTab:['$scope','$rootScope',function($scope,$rootScope){
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


		$('#corrective .btn-danger').click(function () {
	        var selects = $('#correctiveActionTb').bootstrapTable('getSelections'),
	            ids = $.map(selects, function (row) {
	                console.log(row);
	                return row.id;
	            });

	        $('#correctiveActionTb').bootstrapTable('remove', {
	            field: 'id',
	            values: ids
	        });
	    });

		$('#corrective .btn-info').click(function(){
			var select = $('#correctiveActionTb').bootstrapTable('getSelections');
			if(select.length > 0) $('#correctiveActionForm').modal();

		});


		$('#corrective .btn-primary').click(function(){
			$('#correctiveForm')[0].reset();
			$('#correctiveActionForm').modal();
		});

		//$('#correctiveActionTb').bootstrapTable('getData');
		//$('#correctiveActionTb').bootstrapTable('getSelections');
	    
		function generateID() {
			return ''+new Date().valueOf()+parseInt(Math.random()*10000000000,10);
		}

		$('#correctiveActionTb').bootstrapTable('append',[
			{
				id:generateID(),
				state:false,
				descrCA:'erlkgjlkerger',
				takenBy:'Joe',
				company:'Delta',
				date:'12/12/14'
			},
			{
				id:generateID(),
				state:false,
				descrCA:'erlkgjlkerger',
				takenBy:'Joe',
				company:'Delta',
				date:'12/12/14'
			}
		]);

		$.each([$('#correctiveReviewTb'),$('#generalReviewTb')],function(){
			this.bootstrapTable('append',function(){
				var arr = [];
				for(var i=0; i<10; ++i) {
					arr.push({
						id:generateID(),
						name:'fdgdfg',
						value:'fdlgjfdlkgjfdlkjglfdjg'
					});
				}
				return arr;
				
			}());
		});	

		$('#correctiveActionTb').bootstrapTable().on('click-row.bs.table', function (e, row, $element) {
			$element.find('.bs-checkbox input:radio').click();
		});
		
	});
}();