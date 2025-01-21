// Function to add snow statistics to GMBA polygons
// IACS joint body on mountain snow cover, working group 2 
// simon.gascoin@univ-tlse3.fr

var addToGmba = function(config,coi,gmba,getVoi){
  
  // spatial statistics to export
  // weighting: 
  // https://groups.google.com/g/google-earth-engine-developers/c/k_-bszYSIck/m/Irksn_H-CgAJ
  var reducer = ee.Reducer.mean()
    .combine({
      reducer2: ee.Reducer.stdDev(),
      sharedInputs: true
      }).combine({
        reducer2: ee.Reducer.count(),
        sharedInputs: true
    });
  
  // function to add statistics to gmba polygons 
  var addStatGmba = function(yearHemisphere){
    var yh = ee.List(yearHemisphere);
    // get year of beginning date 
    var y1 = yh.getNumber(0);
    // get hemisphere
    var h = yh.getString(1);
    // compute variable of interest
    var voi = getVoi(y1,h);
    // compute spatial statistics
    var gmbaSnow0 = voi.reduceRegions({
      collection:gmba, 
      reducer:reducer, 
      scale:proj.nominalScale(), 
      crs:proj.crs(), 
      });
    // add year property
    var yearIm = ee.Image.constant(y1);
    var gmbaSnow = yearIm.reduceRegions({
      collection:gmbaSnow0, 
      reducer:ee.Reducer.first().setOutputs(['year']), 
      scale:proj.nominalScale(), 
      crs:proj.crs(), 
      });
    return gmbaSnow ;
  };
  
  // function to aggregate annual statistics to a gmba polygon
  var aggregateYear = function(e){
    // get gmba polygon id
    var id = e.get('GMBA_V2_ID');
    // compute polygon centroid latitude
    var lat = e.geometry().centroid(1).coordinates().getNumber(1);
    // select N or S hemisphere
    var statGmbaYear = ee.Algorithms.If(lat.gt(0),statGmbaYearN,statGmbaYearS);
    // get corresponding stats
    var stats = ee.FeatureCollection(statGmbaYear).filter(
      ee.Filter.eq('GMBA_V2_ID',id));
    var mean = stats.aggregate_mean('mean');
    var count = stats.aggregate_mean('count');
    var means = stats.aggregate_array('mean');
    var stds = stats.aggregate_array('stdDev');
    var years = stats.aggregate_array('year');
    // add them to the polygon attribute table
    return e.set({
      'count':count,
      'mean':mean,
      'means':means,
      'stdDevs':stds,
      'years':years
    });
  };
  
  // keep projection to reduce from original scale and crs
  var proj = coi.first().projection();
  
  // years to process
  var yrList =  ee.List.sequence(
    config.ymin, 
    config.ymax);
  
  // prepare list of year-hemisphere pairs
  var nn = ee.List.repeat('N', yrList.length());
  var ss = ee.List.repeat('S', yrList.length());
  var yrListNHemisphere = yrList.zip(nn);
  var yrListSHemisphere = yrList.zip(ss);
  
  // compute stats for every year and hemisphere config 
  var statGmbaYearN = ee.FeatureCollection(
    yrListNHemisphere.map(addStatGmba)).flatten();
  var statGmbaYearS = ee.FeatureCollection(
    yrListSHemisphere.map(addStatGmba)).flatten();
      
  // aggregate by gmba polygon
  var statGmbaYearAgg = gmba.map(aggregateYear);
  
  // copy config in the filename
  var fname = ee.String(
      config.name+config.ymin+config.ymax);
  
  // export results as a csv file
  Export.table.toDrive({
    collection: statGmbaYearAgg, 
    description:fname.getInfo(), 
    folder:'GEE', 
    fileNamePrefix:fname.getInfo(), 
    fileFormat:'CSV',
    selectors:['GMBA_V2_ID','count','mean','means','stdDevs','years'] 
    }); 
  
  return statGmbaYearAgg;
  /*
  // export results as a FeatureView asset
  Export.table.toFeatureView({
    collection: statGmbaYearAgg.select(['GMBA_V2_ID','MapName','mean']),
    assetId: fname.getInfo(),
    description: fname.getInfo()
  });*/
};

exports = {
    addToGmba : addToGmba,
};

