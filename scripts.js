/* Place your JavaScript in this file */
let w, v;
let myChart;
let chartLabels;

const conflevels = ["90%", "95%", "98%", "99%"];
const normcrits = [1.645, 1.96, 2.33, 2.575];

function runSimulation() {
    let resultbox = document.getElementById("resultbox");

    if (typeof (w) != "undefined") {
        w.terminate();
        w = undefined;
    }

    resultbox.value = "";

    showElements(false, "popdesc", "distdesc", "confdesc", "confexperiment", "widthexperiment", "guessmeanintro", "guessmeanguess");


    const numsides = parseInt(document.forms[0].elements["numsides"].value);
    const samplesize = parseInt(document.forms[0].elements["samplesize"].value);
    const numsamples = parseInt(document.forms[0].elements["numsamples"].value);
    const showsample = document.forms[0].elements["showsamp"].checked;

    const mu = numsides * (numsides + 1) / (2 * numsides);
    const sigma = Math.sqrt(numsides * (numsides + 1) * (2 * numsides + 1) / (6 * numsides) - mu * mu);

    const conflevel = document.forms[0].elements["conflevel"].value;
    let critvalue = normcrits[0];

    for (let i = 0; i < conflevels.length; i++) {
        if (conflevels[i] == conflevel) {
            critvalue = normcrits[i];
            break;
        }
    }

    showElements(true, "popdesc");

    document.getElementById("popinfo").innerHTML = "&mu;=" + mu + "<br />&sigma;=" + sigma;
    document.getElementById("confinfo").innerHTML = conflevel;
    document.getElementById("muinfo").innerHTML = mu;
    document.getElementById("sizeinfo").innerHTML = numsamples;

    w = new Worker("simulator.js");



    w.onmessage = function (event) {
        resultbox.value += event.data[0];
        resultbox.scrollTop = resultbox.scrollHeight;

        if (event.data[1]) {

            document.getElementById("simulupdate").innerHTML = "";
            showElements(true, "distdesc", "confdesc");
            chartLabels = [];

            for (let i = 0; i < numsides; i++)
                chartLabels.push(i + 1);

            const rolls = event.data[2];
            const goodsamples = event.data[3];
            const means = event.data[4];
            w.terminate();
            w = undefined;

            const rollsdata = [{
                y: rolls,
                x: chartLabels,
                type: "bar",
                orientation: "v",
                marker: { color: "red" }
            }];

            const rollslayout = {
                title: "Distribution of rolls across all samples",
                xaxis: {
                    tickmode: 'linear',
                    range: [0, numsides + 1]
                }
            };

            Plotly.newPlot("rolldist", rollsdata, rollslayout);

            const meansdata = [{
                x: means,
                type: "histogram",
                orientation: "v",
                marker: { color: "rgba(0,0,255,0.6)" }
            }];

            const distlayout = {
                title: "Distribution of means across all samples",
                xaxis: {
                    tickmode: 'linear',
                    range: [0, numsides + 1]
                },
                shapes: [{
                    type: 'line',
                    x0: mu,
                    y0: 0,
                    x1: mu,
                    yref: 'paper',
                    y1: 1,
                    line: {
                        color: "rgba(50,50,50,1)",
                        width: 1.5,
                        dash: 'dot'
                    }
                }]
            }
            Plotly.newPlot("meanhist", meansdata, distlayout);


            document.getElementById("intinfo").innerHTML = "" + goodsamples + " (" + (goodsamples / numsamples * 100).toFixed(1) + "%)";
        }
        else
            document.getElementById("simulupdate").innerHTML = "Progress: " + event.data[2] + "/" + numsamples;
    }

    w.postMessage([numsides, samplesize, numsamples, showsample, critvalue, true]);
}

function singleSample() {
    let resultbox = document.getElementById("confexsample");

    if (typeof (v) != "undefined") {
        v.terminate();
        v = undefined;
    }

    resultbox.value = "";

    const numsides = parseInt(document.forms[0].elements["numsides"].value);
    const samplesize = parseInt(document.forms[0].elements["samplesize"].value);
    const numsamples = 1
    const showsample = true

    const mu = numsides * (numsides + 1) / (2 * numsides);
    const sigma = Math.sqrt(numsides * (numsides + 1) * (2 * numsides + 1) / (6 * numsides) - mu * mu);

    v = new Worker("simulator.js");


    v.onmessage = function (event) {
        resultbox.value += event.data[0];
        resultbox.scrollTop = resultbox.scrollHeight;

        if (event.data[1]) {
            showElements(true, "confexperiment");
            const xbar = event.data[4][0];
            v.terminate();
            v = undefined;

            const graphdata = new Array(conflevels.length);

            for (let i = 0; i < conflevels.length; i++) {
                let marerr = normcrits[i] * sigma / Math.sqrt(samplesize); //The weird index on normcrits is to do 99% confidence first
                graphdata[conflevels.length - 1 - i] = {
                    x: [xbar - marerr, xbar + marerr],
                    y: [i + 1, i + 1],
                    type: 'scatter',
                    name: conflevels[i] + " confidence"
                };
            }

            const graphlayout = {
                title: "Comparison of confidence intervals for a single sample",
                shapes: [{
                    type: 'line',
                    x0: xbar,
                    y0: 0,
                    x1: xbar,
                    yref: 'paper',
                    y1: 1,
                    line: {
                        color: "rgba(50,50,50,1)",
                        width: 1.5,
                        dash: 'dot'
                    }
                },
                {
                    type: 'line',
                    x0: mu,
                    y0: 0,
                    x1: mu,
                    yref: 'paper',
                    y1: 1,
                    line: {
                        color: "purple",
                        width: 1.5,
                        dash: 'solid'
                    }
                }],
                yaxis: {
                    showticklabels: false
                },
                xaxis: {
                    title: "Dotted line marks sample mean<br />Purple solid line marks population mean",
                    textfont: {
                        family: 'sans serif',
                        size: 11,
                    }
                }
            }
            Plotly.newPlot("confgraph", graphdata, graphlayout);

        }
    }

    v.postMessage([numsides, samplesize, numsamples, showsample, 0, false]);
}

function getSampleSize() {
    let resultbox = document.getElementById("widthsampleoutput");
    let widthbox = document.getElementById("neededsamplesize");

    showElements(true, "widthexperiment");

    if (typeof (v) != "undefined") {
        v.terminate();
        v = undefined;
    }

    resultbox.value = "";

    const conflevel = document.forms[1].elements["desiredconf"].value;
    let critvalue = normcrits[0];

    for (let i = 0; i < conflevels.length; i++) {
        if (conflevels[i] == conflevel) {
            critvalue = normcrits[i];
            break;
        }
    }

    const numsides = parseInt(document.forms[0].elements["numsides"].value);
    const desiredwidth = parseFloat(document.forms[1].elements["intwidth"].value);

    const mu = numsides * (numsides + 1) / (2 * numsides);
    const sigma = Math.sqrt(numsides * (numsides + 1) * (2 * numsides + 1) / (6 * numsides) - mu * mu);

    const samplesize = Math.floor(Math.pow(critvalue * sigma / (desiredwidth / 2), 2) + 1);
    const numsamples = 1
    const showsample = true

    document.getElementById("neededsamplesize").innerHTML = "You need a sample of at least " + samplesize + " rolls for an interval that's no more than " + desiredwidth + " wide.";

    v = new Worker("simulator.js");

    v.onmessage = function (event) {
        resultbox.value += event.data[0];

        if (event.data[1]) {
            showElements(true, "widthexperiment", "guessmeanintro");
            const xbar = event.data[4][0];
            v.terminate();
            v = undefined;

            let marerr = critvalue * sigma / Math.sqrt(samplesize);
            let graphdata = [{
                x: [xbar - marerr, xbar + marerr],
                y: [1, 1],
                type: 'scatter',
                name: conflevel + " confidence"
            }];


            const graphlayout = {
                title: conflevel + " Confidence Interval with Width of " + desiredwidth,
                shapes: [{
                    type: 'line',
                    x0: xbar,
                    y0: 0,
                    x1: xbar,
                    yref: 'paper',
                    y1: 1,
                    line: {
                        color: "rgba(50,50,50,1)",
                        width: 1.5,
                        dash: 'dot'
                    }
                },
                {
                    type: 'line',
                    x0: mu,
                    y0: 0,
                    x1: mu,
                    yref: 'paper',
                    y1: 1,
                    line: {
                        color: "purple",
                        width: 1.5,
                        dash: 'solid'
                    }
                }],
                yaxis: {
                    showticklabels: false
                },
                xaxis: {
                    title: "Dotted line marks sample mean<br />Purple solid line marks population mean",
                    textfont: {
                        family: 'sans serif',
                        size: 11,
                    },
                    range: [Math.floor(xbar-marerr)-.25, Math.ceil(xbar+marerr)+.25]
                }
            }
            Plotly.newPlot("sizegraph", graphdata, graphlayout);
        }
    }

    v.postMessage([numsides, samplesize, numsamples, showsample, critvalue, false]);
}

function generateUnknownSample()
{
    let n = 30;
    let mu = getRndInteger(150,1200)/10;
    let sigma = getRndInteger(30,100)/10;

    let sum = 0;
    let sumsquare = 0;
    let stringout = "";

    for (let i = 0; i < n; i++)
    {
        let x = getNormallyDistributedRandomNumber(mu,sigma);
        x = Math.round(10*x)/10.0;

        sum += x;
        sumsquare += x*x;

        stringout += x.toFixed(1).padStart(5) + ( (i+1)%10 == 0 ? "\n" : " ");
    }

    let xbar = (sum/n);
    let sx = Math.sqrt((sumsquare - n*xbar*xbar)/(n-1));

    stringout += "\n\nSample Mean: " + xbar.toFixed(2) +"\n";
    stringout += "Sample Std Dev: " + sx.toFixed(2) + "\n";
    stringout += "Sample Size: " + n + "\n";
    stringout += "DEBUG - mu " + mu + " sigma " + sigma + "\n";

    let outputBox = document.getElementById("unknownsampleoutput");
    
    outputBox.value = stringout;
    outputBox.scrollTop = outputBox.scrollHeight;

    let width95 = 1.96*sx / Math.sqrt(n) * 2 + .1 ;
    width95 = Math.ceil(width95*10)/10;
    document.getElementById("maxguesswidth").innerHTML = (width95);
    document.getElementById("guessresult").innerHTML = "";
    
    showElements(true, "guessmeanguess");
    sessionStorage.setItem("ciguess-mu", mu.toString());
    sessionStorage.setItem("ciguess-ciwidth", width95.toString());
}

function checkGuess()
{
    let mu = parseFloat(sessionStorage.getItem("ciguess-mu"));
    let width95 = parseFloat(sessionStorage.getItem("ciguess-ciwidth"));

    let lowguess = parseFloat(document.forms[2].elements["lowguess"].value);
    let highguess = parseFloat(document.forms[2].elements["highguess"].value);

    let outputbox = document.getElementById("guessresult");

    if (lowguess > highguess)
    {
        let temp = lowguess;
        lowguess = highguess;
        highguess = temp;
    }

    if (highguess - lowguess > width95 * 1.02)
    {
        guessresult.innerHTML = "This guess is too wide. Your high and low guesses can only be "+width95+ " apart. Guess again.";
    }
    else if (lowguess < mu && mu < highguess)
    {
        guessresult.innerHTML = "Nice work! The true mean was "+ mu + "!";
    }
    else
    {
        guessresult.innerHTML = "Your guess does not contain the population mean. Try again!";
    }

    guessresult.scrollIntoView();
}

function showElements(visible, ...elementList) {
    for (let i = 0; i < elementList.length; i++) {
        let e = document.getElementById(elementList[i]);

        if (visible)
            e.style.display = "block";
        else
            e.style.display = "none";
    }
}


//from https://www.w3schools.com/js/js_random.asp
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

//from https://mika-s.github.io/javascript/random/normal-distributed/2019/05/15/generating-normally-distributed-random-numbers-in-javascript.html
function boxMullerTransform() {
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    
    return { z0, z1 };
}

function getNormallyDistributedRandomNumber(mean, stddev) {
    const { z0, _ } = boxMullerTransform();
    
    return z0 * stddev + mean;
}