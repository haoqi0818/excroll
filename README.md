
[Example](http://qzs.qzone.qq.com/qzone/qzact/common.m/excroll/index.html)

```
Excroll.init({  
    wrap: 'body',  
    item: 'section',  
    beforeScroll: function(from, to) {  
        console.info('before', from, to)  
    },  
    afterScroll: function(from, to) {  
        console.info('after', from, to)  
    }  
});  
```

可选参数：  
```
wrap: '.excroll', // 容器元素  
item: '.item', // 子元素过滤  
slider: 'none', // 切换效果  
timing: 'ease', // 切换缓动函数  
activeClass: 'active', // 当前元素类  
duration: 1000, // 切换过程时长  
loop: 'none', // 是否可循环，可选值none/prev/next/both，非none会拷贝子元素使元素个数至少5个  
swipeDirection: 'horizon|vertical', // 绑定手势，可选值horizon/vertical/horizon|vertical  
swipeArea: 'global', // 手势范围，全屏或容器元素，可选值global/local，不填则不绑定手势  
beforeScroll: null, // callback(oldPage, newPage)  
afterScroll: null   // callback(oldPage, newPage)  
```