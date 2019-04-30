(function(){
  'use strict';
  let results = localStorage.getItem('results') || '100';
  const chartMap = {
    '우리집 내부기온': 'air_temperature',
    'RPI CPU온도': 'rpi_cpu',
    '우리집 내부습도': 'air_humidity',
    'RPI LOAD 1M': 'rpi_load',
    '우리집 내부PM25': 'air_pm',
    '우리집 내부CO2': 'air_co2',
    '우리집 외부기온': 'air_temperature',
    '우리집 외부습도': 'air_humidity',
    '우리집 외부PM10': 'air_pm',
    '우리집 외부PM25': 'air_pm'
  };
  const colors = ['red', 'navy', 'green', 'blue'];

  const apis = [];
  for(let i=1; i< 9; i++){
    apis.push(`https://thingspeak.com/channels/759760/field/${i}.json?offset=0&results=${results}`);
    if(i < 3){
      apis.push(`https://thingspeak.com/channels/766475/field/${i}.json?offset=0&results=${results}`);
    }
  }

  Promise.all(apis.map(v=>fetch(v)))
  .then(res => {
    const data = [];
    res.forEach((r, i) => {
      r.json().then(d=>{
        const key = Object.keys(d.feeds[0]).pop();
        const id = 'a' + d.channel.id + '_' + key;
        const name = d.channel.name + ' ' + d.channel[key];
        data.push({
          id: id,
          label: name,
          key: key, 
          type: 'line', pointRadius: 0, fill: false, borderWidth: 2, lineTension: 0.3,
          data: d.feeds.map(v => {
            return {t: moment(v.created_at).format('YYYY-MM-DD HH:mm'), y: parseFloat(v[key]) || 0}
          }),
          chart: chartMap[name]
        });
      });
    });
    setTimeout(()=>{drawChart(data);},200);
    // drawChart(data);
  }).catch((err) => {
      console.log(err);
  });
    
  function drawChart(data){
    // console.log('DATA', data);
    const canvases = document.querySelectorAll('canvas');
    
    canvases.forEach(c => {
      const ctx = c.getContext('2d');
      const datasets = data.filter(d => d.chart === c.id );
      const span = c.previousElementSibling.querySelector('span');
      const unit = c.dataset['unit'];
      datasets.forEach((d, i) => {
        d.borderColor = colors[i];
        d.backgroundColor = colors[i];
        span.innerHTML += ` <span style="color:${colors[i]}">${d.data[d.data.length-1].y + unit}</span> `;
      });
      const cfg = {
        data: {
          datasets: datasets
        },
        options: {
          legend: {
            display: true,
            position: 'top',
            lineWidth: 2,
            labels: {
                fontColor: 'rgb(0, 0, 0)'
            }
        },
          scales: {
            xAxes: [{
              type: 'time',
              distribution: 'series',
              ticks: {
                source: 'auto',
                autoSkip: true
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: unit,
              }
            }]
          },
          tooltips: {
            intersect: false,
            mode: 'index',
            callbacks: {
              label: function(tooltipItem, myData) {
                var label = myData.datasets[tooltipItem.datasetIndex].label || '';
                if (label) {
                  label += ': ';
                }
                label += parseFloat(tooltipItem.value) + c.dataset['unit'];
                return label;
              }
            }
          },
          hover: {animationDuration: 0},
          responsiveAnimationDuration: 0
        }
      }
      ctx.canvas.width = 1000;
      ctx.canvas.height = 300;
      new Chart(ctx, cfg);
      
    });
  }

  document.querySelector('#results').value = results;
  document.querySelector('#results').addEventListener('change', (ev)=>{
    results = ev.target.value;
    localStorage.setItem('results', results);
    location.reload();
  }, false);

})();