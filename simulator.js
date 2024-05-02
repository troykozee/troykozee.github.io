onmessage = (e) => {


    let numsides=e.data[0];
    let samplesize=e.data[1];
    let numsamples=e.data[2];
    let showsample=e.data[3];
    let critvalue = e.data[4];
    let testInterval = e.data[5];


    let mu = numsides * (numsides+1)/(2*numsides);
    let sigma = Math.sqrt(numsides*(numsides+1)*(2*numsides+1)/(6*numsides) - mu*mu);

    let rollDistrib = [];
    let meanDistrib = new Array(numsamples);

    for (let i=0; i < numsides; i++)
        rollDistrib.push(0);

    let goodsamples = 0;
    let resultString = "";
    let updateInterval = Math.min(5000,Math.floor(numsamples*.1));

    for (let i=0; i < numsamples; i++)
    {
        let sum = 0;
        let samplecontents="";
        for (let j=0; j < samplesize; j++)
        {
            let num = getRndInteger(1,numsides);

            rollDistrib[num-1]++;

            if (showsample)
            {
                samplecontents += num + ( (j+1)%20 == 0 ? "\n" : " ");
            }
            sum += num;
        }

        let xbar = sum / samplesize;

        meanDistrib[i] = xbar;

        resultString += "Sample " + (i+1)+ ". Mean: " + xbar;

        if (testInterval)
        {
            let marerr = critvalue*sigma/Math.sqrt(samplesize);
            resultString += " Interval: ("+(xbar-marerr).toFixed(4)+","+(xbar+marerr).toFixed(4)+") - ";
            if (xbar-marerr < mu && mu < xbar+marerr)
            {
                 goodsamples++;
                 resultString+="Contains mu!";
            }
            else
            {
                resultString+="DOES NOT CONTAIN MU!";
            }
        }

        resultString += "\n";

        if (showsample)
          resultString += samplecontents + "\n";

        if ( (i+1)%updateInterval == 0) {
            postMessage([resultString,false,i+1]);
            resultString="";
        }
    }

    if (testInterval)
        resultString += "\nTotal number of samples containing mu: "+goodsamples+ " ("+ (goodsamples/numsamples*100).toFixed(2) + "%)";
    
    postMessage([resultString,true,rollDistrib,goodsamples,meanDistrib]);
};

//from https://www.w3schools.com/js/js_random.asp
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}