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
								ngModelCtrl.$setValidity('incidentFld', isValid(viewValue));
								return viewValue;
							});

							ngModelCtrl.$formatters.unshift(function (modelValue) {
								ngModelCtrl.$setValidity('incidentFld', isValid(modelValue));
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
	
	app.filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }]);

	validator.create('valDate',function(v){
			var re = /^(0[0-9]|1[0-2])\/([0-2][0-9]|3[0-1])\/(20[1-9][4-9]) (0[0-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
			return re.test(v+'');
	});
	
	validator.create('valName',function(v){
		var re = /^[A-Za-z\sа-яА-ЯіІїЇҐґ]+$/;
		if(v === undefined) v = '';
		return re.test(v+'');
	});

	validator.create('valNameNotReq',function(v){
		var re = /^[A-Za-z\sа-яА-ЯіІїЇҐґ]+$/;
		if(v === undefined || v === '') return true;
		return re.test(v+'');
	});
	
	validator.create('valSelect',function(v){
		switch(typeof v) {
			case 'undefined': return isNaN(+!!v);
			case 'string': return isNaN(+v);
			case 'default': return isNaN(v);
		}
	});
	
	validator.create('valPhone',function(v){
		var re = /^[0-9]{3}.[0-9]{3}.[0-9]{4}$/;
		return re.test(v+'');
	});
	
	validator.create('valTextarea',function(v){
		if(v === undefined) v = '';
		return !!encodeURI(v);
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

		correctiveTab:['$scope','$rootScope','$compile',function($scope,$rootScope,$compile){
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
				if(!confirm('Are you sure you want to delete the action?')) return;

				var selects = $('#correctiveActionTb').bootstrapTable('getSelections'),
		            ids = $.map(selects, function (row) { return row.id; });
		        
		        if(ids[0] in $scope.corrective.actions)
		        		delete $scope.corrective.actions[ids[0]]; 
		        
		        $('#correctiveActionTb').bootstrapTable('remove',{field:'id',values:ids});
		        if($scope.corrective.count > 0) --$scope.corrective.count;
		        if($scope.corrective.count < $scope.corrective.max) remBadgeAlert();
			};

			function addBadgeAlert(){
				var b = $('.action-count');
				if(!b.hasClass('alert-danger'))
					b.addClass('alert-danger');
			}

			function remBadgeAlert(){
				var b = $('.action-count');
				if(b.hasClass('alert-danger'))
					b.removeClass('alert-danger');
			}

			$scope.corrective.addAction = function(){
				if($scope.corrective.count >= $scope.corrective.max) return;
				remBadgeAlert();
				$scope.corrective.resetForm();
				$scope.corrective.state='add';
				$('#correctiveActionForm').modal('show');
			};

			$scope.corrective.resetForm = function(){
			    delete $scope.corrective.ID;
			   	delete $scope.corrective.descrCA;
				delete $scope.corrective.takenBy;
				$scope.corrective.companyReporter.current = '0';
				delete $scope.corrective.date;
			    
				$('#correctiveForm').empty()
			    	.append($compile(cacheCorrectiveForm)($scope));
			    initialDTP();	
			};

			$scope.corrective.getTitle = function(){
				switch($scope.corrective.state){
					case 'add': return 'Add Action';
					case 'edit': return 'Edit Action';
				} 
			};

			var require = ['dateAct','_companyReporter','takenBy','correctiveDscr'];
			$scope.corrective.saveAction = function(){
				if(invalidateFields.call($scope,'correctiveForm',require)) return;

				var id = $scope.corrective.ID || generateID();

				$scope.corrective.actions[id] = {
					id:id,
					state:false,
					descrCA:$scope.corrective.descrCA,
					takenBy:capitalize($scope.corrective.takenBy),
					company:$scope.corrective.companyReporter.current,
					date:$scope.corrective.date
				};

				var actions = [];
				angular.forEach($scope.corrective.actions,function(value){ this.push(value); },actions);
				$scope.corrective.count = actions.length;
				addToRewiev(actions);
				if($scope.corrective.count >= $scope.corrective.max) addBadgeAlert();
				$('#correctiveActionTb').bootstrapTable('load',actions);
				$('#correctiveActionForm').modal('hide');
			};

			function addToRewiev(arr) {
				var names = {
					descrCA:'Description of Corrective Action',
					takenBy:'Action Taken By',
					company:'Company',
					date:'Date'
				};
				var newArr = [];
				for(var i=0; i<arr.length; ++i) {
					for(var j in arr[i]) {
						if(!(j in names)) continue;
						newArr.push({
							name:'<b>'+names[j]+' ('+(i+1)+'):</b>',
							value:arr[i][j]
						})
					}
				}
				$('#correctiveReviewTb').bootstrapTable('load',newArr);
			}
		}],

		submitTab:['$scope','$rootScope','$window',function($scope, $rootScope,$window){
			$scope.genForm = $rootScope.$$childHead.genForm;
			$scope.getRequireFildValue = function(field) {
				var html = "";
				if(field in $scope.genForm
					&& $scope.genForm[field].$valid)
						html = $scope.genForm[field].$viewValue;
				else html = '<span class="text-danger">The field is required.</span>';
				return html;
			};
		}]
	};
	
	for(var i in ctrls)
		app.controller(i,ctrls[i]);	

	function invalidateFields(frm, require) {
		for(var i=0;i<require.length;++i) {
			if(this[frm][require[i]].$error.incidentFld) return true;
		}
	}

	function generateID() {
		return ''+new Date().valueOf()+parseInt(Math.random()*10000000000,10);
	}

	function capitalize(str) {
		if (str === undefined) { str = ''; }
		str = str.replace(/^\s+/,'').replace(/\s+$/,'').replace(/(\s+)/g,' ').split(' ');
		for(var i=0; i<str.length; ++i)
			str[i] = str[i].charAt(0).toUpperCase() + str[i].substring(1);
		return str.join(' ');
	}

	var cacheCorrectiveForm = $('#correctiveForm').html();

	function initialDTP() {
		$(".form_datetime").datetimepicker({
			format: "mm/dd/yyyy HH:ii P",
			showMeridian: true,
			autoclose: true,
			todayBtn: true
		});
	}

	window.colorfulRows = function(row, index) {
	    if (index % 2 === 0) {
	        return {classes:'active'};
	    }
	    return {};
	};

	$(document).ready(function () {
		$('#incFormTabs a').click(function (e) {
		  e.preventDefault()
		  $(this).tab('show')
		});

		$('#correctiveActionTb').bootstrapTable().on('click-row.bs.table', function (e, row, $element) {
			$element.find('.bs-checkbox input:radio').click();
		});

		initialDTP();
	});

}();