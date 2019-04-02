/**
 * @description all data with in years
 * @type {{geo: any, trade: []}}
 */
const statistic = {
    'geo': {},
    'trade': {
    }
};

/*
 * Main logic
 */
function main() {
    fetchData(allData => {
        const [geo, trade] = allData;
        statistic['geo'] = geo;
        statistic['trade'] = trade;

        autoTimeline(5000);
    }, err => {
        alert(err);
    });
}

main();


/**
 * @param {function} success callback function
 * @param {function} fail callback function
 */
function fetchData(success = function (){}, fail = function (){}) {
    const dataSources = [
        'data/newgeo.json',
        'data/trade.json'
    ];
    Promise.all(dataSources.map(async path => {
        let response = await fetch(path);
        return response.json();
    })).then(allData => {
        success(allData);
    }).catch(fail);
}


const dom = document.getElementById("container");
/**
 * @param {Array<any>} args
 */
function process(geoCoordMap, TradeData) {
    const myChart = echarts.init(dom);
    const app = {};
    option = null;

    var convertData = function(data) {
        var res = [];
        for (var i = 0; i < data.length; i++) {
            var dataItem = data[i];
            var fromCoord = geoCoordMap[dataItem[0].name];
            var toCoord = geoCoordMap[dataItem[1].name];
            if (fromCoord && toCoord) {
                res.push([{
                        coord: fromCoord,
                        value: dataItem[0].value
                    },
                    {
                        coord: toCoord
                    }
                ]);
            }
        }
        return res;
    };

    var series = [];
    [
        ["China", TradeData]
    ].forEach(function(item, i) {
        series.push({
                type: "lines",
                zlevel: 2,
                effect: {
                    show: true,
                    period: 4, //箭头指向速度，值越小速度越快
                    trailLength: 0.02, //特效尾迹长度[0,1]值越大，尾迹越长重
                    symbol: "arrow", //箭头图标
                    symbolSize: 5 //图标大小
                },
                lineStyle: {
                    normal: {
                        width: 1, //尾迹线条宽度
                        opacity: 0, //尾迹线条透明度
                        curveness: 0.3 //尾迹线条曲直度
                    }
                },

                data: convertData(item[1])
            }, {
                type: "effectScatter",
                coordinateSystem: "geo",
                zlevel: 2,
                rippleEffect: {
                    //涟漪特效
                    period: 4, //动画时间，值越小速度越快
                    brushType: "stroke", //波纹绘制方式 stroke, fill
                    scale: 4 //波纹圆环最大限制，值越大波纹越大
                },
                label: {
                    normal: {
                        show: true,
                        position: "right", //显示位置
                        offset: [5, 0], //偏移设置
                        formatter: "{b}" //圆环显示文字
                    },
                    emphasis: {
                        show: true
                    }
                },
                symbol: "circle",
                symbolSize: function(val) {
                    return 4 + val[2] / 10000; //圆环大小
                },
                itemStyle: {
                    normal: {
                        show: false,
                    }
                },
                data: item[1].map(function(dataItem) {
                    if (!geoCoordMap[dataItem[0].name]) {
                        console.error(dataItem[0].name);
                        console.log(geoCoordMap);
                    }
                    return {
                        name: dataItem[0].name,
                        value: geoCoordMap[dataItem[0].name].concat([dataItem[0].value])
                    };
                })
            },
            //被攻击点
            {
                type: "scatter",
                coordinateSystem: "geo",
                zlevel: 2,
                rippleEffect: {
                    period: 4,
                    brushType: "stroke",
                    scale: 4
                },
                label: {
                    normal: {
                        show: true,
                        position: "right",
                        color: "#00ffff",
                        formatter: "{b}",
                        textStyle: {
                            color: "#0bc7f3"
                        }
                    },
                    emphasis: {
                        show: true
                    }
                },
                symbol: "pin",
                symbolSize: 30,
                itemStyle: {
                    normal: {
                        show: true,
                        color: "#9966cc"
                    }
                },
                data: [{
                    name: item[0],
                    value: geoCoordMap[item[0]].concat([100])
                }]
            }
        );
    });

    option = {
        backgroundColor: '#000',
        tooltip: {
            trigger: "item",
            backgroundColor: "#1540a1",
            borderColor: "#FFFFCC",
            showDelay: 0,
            hideDelay: 0,
            enterable: true,
            transitionDuration: 0,
            extraCssText: "z-index:100",
            formatter: function(params, ticket, callback) {
                //根据业务自己拓展要显示的内容
                var res = "";
                var name = params.name;
                var value = params.value[params.seriesIndex + 1];
                // res =
                //     "<span style='color:#fff;'>" +
                //     name +
                //     "</span><br/>数据：" +
                //     value;
                return res;
            }
        },
        visualMap: {
            //图例值控制
            min: 0,
            max: 10000,
            show: false,
            calculable: true,
            color: ["#0bc7f3"],
            textStyle: {
                color: "#fff"
            },

        },
        geo: {
            map: "world",
            label: {
                emphasis: {
                    show: false
                }
            },
            roam: true, //是否允许缩放
            layoutCenter: ["50%", "50%"], //地图位置
            layoutSize: "180%",
            itemStyle: {
                normal: {
                    color: "#04284e", //地图背景色
                    borderColor: "#5bc1c9" //省市边界线
                },
                emphasis: {
                    color: "rgba(37, 43, 61, .5)" //悬浮背景
                }
            }
        },

        series: series
    };
    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }
}

/**
 * 
 * @param {string} year
 */
function handleChangeTimeline(year) {
    year = parseInt(year, 10);
    console.log(year);

    const {geo, trade} = statistic;
    process(geo, trade[year]);
}

/**
 * Auto scroll timeline bar
 * @param {number} milliseconds 
 */
function autoTimeline(milliseconds) {
    const $slider = document.getElementById('timelineController');
    let year = 1988;
    let timer = setInterval(() => {
        if (year > 2015) {
            return clearInterval(timer);
        }
        $slider.value = year++;
        handleChangeTimeline(year);
    }, milliseconds);
}
