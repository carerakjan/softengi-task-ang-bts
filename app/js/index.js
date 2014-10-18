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
								ngModelCtrl.$setValidity('incidentFld', isValid(viewValue,scope, elm, attrs));
								return viewValue;
							});

							ngModelCtrl.$formatters.unshift(function (modelValue) {
								ngModelCtrl.$setValidity('incidentFld', isValid(modelValue,scope, elm, attrs));
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
			
			$scope.general.capitalize = function(field,value) {
				if(field in $scope.general)
					$scope.general[field] = capitalize(value);
			}

			$scope.general.severity = {
				data: [
					{severity:'Loss well controll',apply:false},
					{severity:'Fatality(ies)',apply:false},
					{severity:'Hospitalization or medical treatment',apply:false},
					{severity:'Spill offsite > 50 Dbls',apply:false},
					{severity:'Spill to water, any amount',apply:false},
					{severity:'Property damage',apply:false},
					{severity:'None Apply',apply:false}
				],
				rewievs:[],
				fire:function(sv){
					var m = ['addToRewiev','checkAndReset'];
					var t = this;
					m.forEach(function(v) { t[v](sv); });
				},
				addToRewiev:function(sv){
					var t = this;
					this.data.forEach(function(obj) {
						if(obj.severity == sv && obj.apply == true)
							t.rewievs.push(sv);
					});
				},
				checkAndReset:function(sv){
					this.resetAllExcept({'None Apply':1, reverse:function(){
						return (sv == 'None Apply')?false:true;
					}()});
				},
				resetAllExcept:function(param){
					this.data.forEach(function(obj) {
						if(param.reverse) {
							if(obj.severity in param) obj.apply = false;
							return;
						}

						if(obj.severity in param) return;
						obj.apply = false;
					});
				},
				atLeastOneSelected: function () {
					var t = this;
					return Object.keys(t.data).some(function (k) {
						return t.data[k].apply;
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
				
				var selects = $('#correctiveActionTb').bootstrapTable('getSelections'),
		            ids = $.map(selects, function (row) { return row.id; });
		        
		        if(ids.length === 0) return;
				if(!confirm('Are you sure you want to delete the action?')) return;

		        if(ids[0] in $scope.corrective.actions)
		        		delete $scope.corrective.actions[ids[0]]; 
		        
		        $('#correctiveActionTb').bootstrapTable('remove',{field:'id',values:ids});
		        if($scope.corrective.count > 0) --$scope.corrective.count;
		        if($scope.corrective.count < $scope.corrective.max) remBadgeAlert();

		        var actions = [];
				angular.forEach($scope.corrective.actions,function(value){ this.push(value); },actions);
				$scope.corrective.count = actions.length;
				addToRewiev(actions);
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
			$(window).on('message',function(e){
				var d = e.data || e.originalEvent.data || window.event.data;
				if(d == 'DOMContentLoaded') {
					$scope.report.send($scope.reportWin); 
				}
			});

			$scope.genForm = $rootScope.$$childHead.genForm;
			$scope.severitiesRewies = $rootScope.$$childHead.general.severity.rewievs;
			$scope.report = new Report();

			var generalFlds = {
				'Date and Time of Incident':'dateIncident',
				'Reported By':'reportedBy',
				'Company of Reporter':'companyReporter',
				'Contact Number':'contactNumber',
				'Supervisor Name':'supervisorName',
				'High Level Description of Incident':'description',
				'Well Number':'wellNumber',
				'Region':'region',
				'State':'state',
				'Field Office':'fieldOffice'
			};

			$scope.submit = function(){
				$scope.report.clear();
				Object.keys(generalFlds).some(function(k){
					$scope.report.push({name:k,values:[$scope.genForm[generalFlds[k]].$viewValue]});
				});

				var correctFlds = $('#correctiveReviewTb').bootstrapTable('getData');
				correctFlds.forEach(function(obj){
					$scope.report.push({name:$(obj.name).text(),values:[obj.value]});
				});

				$scope.reportWin = $window.open('report.html','_blank','');
			};

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

	function Report() {
		this.default = function() {
			return {
				workflowCreationInformation:{
					workflowTypeName:'Incident Report',
					name:'Report - ' + dateFormat(new Date().valueOf(),'#YY#.#MM#.#DD#')
				},
				workflowStepUpdateInformation:{
					stepIdOrName:'Initial Step',
					fields:[]
				}
			}
		}();
		this.clear = function() {
			this.default.workflowStepUpdateInformation.fields = [];
		};
		this.push = function(source) {
			this.default.workflowStepUpdateInformation.fields.push(source);	
		};
		this.send = function(to){
			if(to && to.postMessage)
				to.postMessage(angular.toJson(this.default,true),'*');
		}
	};

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

	function dateFormat(di,tmp){
		//#hh# #mm# #ss# #DD# #MM# #YY# #yy#
		var _d = parseInt(di,10);
		if(isNaN(_d)) return di;
		_d = new Date(_d);
		var buf = tmp;
		var toStr = function(val){
			var _v = parseInt(val,10);
			if(isNaN(_v)) return "00";
			if(_v < 10) return "0"+_v;
			return _v;
		};
		var _do = {
			hh:toStr(_d.getHours()),
			mm:toStr(_d.getMinutes()),
			ss:toStr(_d.getSeconds()),
			DD:toStr(_d.getDate()),
			MM:toStr(_d.getMonth()+1),
			YY:_d.getFullYear(),
			yy:toStr(_d.getFullYear()%100)
		}
		if(/#hh#/g.test(tmp)) buf = buf.replace(/#hh#/g,_do.hh);
		if(/#mm#/g.test(tmp)) buf = buf.replace(/#mm#/g,_do.mm);
		if(/#ss#/g.test(tmp)) buf = buf.replace(/#ss#/g,_do.ss);
		if(/#DD#/g.test(tmp)) buf = buf.replace(/#DD#/g,_do.DD);
		if(/#MM#/g.test(tmp)) buf = buf.replace(/#MM#/g,_do.MM);
		if(/#YY#/g.test(tmp)) buf = buf.replace(/#YY#/g,_do.YY);
		if(/#yy#/g.test(tmp)) buf = buf.replace(/#yy#/g,_do.yy);
		return buf;
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