!function() {
	var app = angular.module('IncidentForm',[]); 

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