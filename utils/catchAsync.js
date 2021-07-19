module.exports = func =>{
    return (req,res,next) =>{
        func(req,res,next).catch(next);
    }
}

// catchAsync ek function ko lega aur ek function return krega..... vo uss function mei (jo ki humara route handler h) error hoga toh catch kr dega varna normally execution ho jaayega.... jese ki price ki jagah humne koi string daal di toh hum uss error ko pakad lenge aur usko show kr denge