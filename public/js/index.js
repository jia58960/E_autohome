$(function(){
	var $main = $('#main-wrapper');
	var $condition = $('.condition-wrapper');
	var $type = $('#type-wrapper');
	var $price = $('#price-wrapper');
	var $feature = $("#feature-wrapper");
	var $new = $('#new');
	var $sub = $('#sub');
	var $init = $('.init');
	var $all = $('#all');
	var $old = $('#old');
	$("input[type=checkbox], input[type=radio]").uniform();

	$all.on('click', function(){
		if (confirm('执行此操作耗时较长，确定继续吗？')) {
			$self.attr('disabled', 'disabled');
			$self.text('分析中...');
			$.ajax({
				url:'/level/all',
				type:'GET',
				cache: false,
				success:function(res){
					if (res.success === 1) {
						/*$self.text('初始化成功');
						var data = res.data;
						var levels = data.levels;
						var conditions = data.conditions;*/
					} else {
						$self.text('未知错误！');
					}
				}
			});
		}
		
	});

	$init.on('click', function(){
		$old.hide();
		var $self = $(this);
		$self.attr('disabled', 'disabled');
		$self.text('初始化数据中...');
		$.ajax({
			url:'/level/list',
			type:'GET',
			cache: false,
			success:function(res){
				if (res.success === 1) {
					$self.text('初始化成功');
					var data = res.data;
					var levels = data.levels;
					var conditions = data.conditions;
				} else {
					$self.text('发生错误');
				}
			}
		});
	});

	//btn样式切换
	$main.on('click', '.btn-default', function(){
		var $self = $(this);
		$self.addClass('active');
		$self.siblings().removeClass('active');
	});

	$old.on('click', function(){
		var $self = $(this);
		$self.attr('disabled', 'disabled');
	});

	var getFeatureVal = function (handler, name, type) {
      var tmp = [];
      var arrs = handler.find("[name="+name+"]:checked");

      if (type === 1) { //ID拼接
          arrs.each(function(){
              var $this = $(this);
              tmp.push($this.val());
          });    
      } else { //值拼接
          arrs.each(function(){
              var $this = $(this);
              tmp.push($this.parents('label.checkbox').text());
          });
      }

      return tmp.join("_");
  };
	var getPrice = function() {
		var min = $('#min-price').val();
		var max = $('#max-price').val();
		var pos = $price.data('pos');
		var minText = parseInt($('#min-price option:selected').text(),10);
		var maxText = parseInt($('#max-price option:selected').text(),10);
		if (maxText < minText) {
			alert('价格区间选择错误！');
			$sub.text('选好了？走你！');
			$sub.removeAttr('disabled');
			return false;
		} else {
			return {
				value: min+'_'+max,
				pos:pos
			};
		}
	};

	var getFeature = function() {
		var ids = getFeatureVal($feature, 'feature', 1);
		var pos = $feature.data('pos');
		return {
			value:ids?ids:0,
			pos:pos
		};
	};
	//
	var getOthers = function() {
		var othersArr = [];
		$condition.each(function(k,v){
			var $self = $(v);
			var pos = $self.data('pos');
			var val = $self.find('.active').data('val');
			othersArr.push({
				value:val,
				pos:pos
			});
		});
		return othersArr;
	};

	var getUrl = function(param) {
		var arr = [];
		param.forEach(function(v, k){
			arr[v.pos] = v.value;
		});
		arr.shift(); //去除第一个元素
		return arr.join('-');
	};
	//走起！
	$sub.on('click', function(){
		var $self = $(this);
		$self.attr('disabled', 'disabled');
		$self.text('努力查询中...');
		var type = $type.find('.active').data('level');
		var preffix = 'http://www.autohome.com.cn/'+type+'/';
		var filtersArr = [];
		filtersArr.push(getPrice());
		filtersArr.push(getFeature());
		var allParam = filtersArr.concat(getOthers());
		console.log(allParam);
		var finalUrl = preffix + getUrl(allParam) +'/';
		getSearchPage(finalUrl);
	});

	var getSearchPage = function(url) {
		$.ajax({
			url:'/category/list?url='+url,
			type:'GET',
			success:function(res){
				if (res.success === 1) {

				} else {
					$self.text('发生错误');
				}
			}
		});
	};
});