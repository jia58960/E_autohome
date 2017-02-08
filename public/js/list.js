$(function(){
	$('#lists').on('click','.btn',function(e){
		var self = $(this);
		var cid = self.data('cid');
		//var tr = $('#item-id-' + id);
		$.ajax({
			type:'post',
			url:'/index/catelist',
			data:{cate_id:cid},
			success:function(res) {
				if (res.success == 1) {
					var series = res.data;
					if (series && series.length) {
						var tmp = [];
						//console.log(series);
						series.forEach(function(v,k) {
							if (v.carslink){
								tmp[k] = '<li><a href="javascript:;" data-id="'+v._id+'">'+v.name+'</a><span>（'+v.reference+'</span>）</li>';
							} else {
								tmp[k] = '<li>'+v.name+'(信息不详)</li>';
							}
						});
						$('#seires').html(tmp.join(''));

					} else {
						$('#seires').html('<li>暂无数据！</li>');
					}
					$('#seriesModal').modal('show');
				} else {
					console.log(res.msg);
				}
			},
			error:function(err) {
				console.log(err);
			}
		});
	});

	$('#seires').on('click','a',function(e){
		var self = $(this);
		var cid = self.data('id');
		//var tr = $('#item-id-' + id);
		$.ajax({
			type:'post',
			url:'/index/carlist',
			data:{carid:cid},
			success:function(res) {
				if (res.success == 1) {
					var cars = res.data;
					if (cars && cars.length) {
						var tmp = [];
						console.log(cars);
						cars.forEach(function(v,k) {
							tmp[k] = '<li><a href="/detail?cid='+v._id+'" target="_blank">'+v.name+'</a></li>';
						});
						$('#cars-list').html(tmp.join(''));

					} else {
						$('#cars-list').html('<li>该系列下暂无车辆数据！</li>');
					}
					$('#carsModal').modal('show');
				} else {
					console.log(res.msg);
				}
			},
			error:function(err) {
				console.log(err);
			}
		});
	});
});