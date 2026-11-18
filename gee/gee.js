// Study area: Demak coast (check it on the map, adjust if needed)
var roi = ee.Geometry.Rectangle([110.40, -7.00, 110.75, -6.75]);
Map.centerObject(roi, 10);

// Remove clouds and cloud shadows
function maskS2(img) {
  var scl = img.select('SCL');
  var bad = scl.eq(3).or(scl.eq(8)).or(scl.eq(9)).or(scl.eq(10)).or(scl.eq(11));
  return img.updateMask(bad.not());
}

// One cleaned image per year (dry season June-September)
function composite(year) {
  var col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(roi)
    .filterDate(year + '-06-01', year + '-09-30')
    .map(maskS2);
  var img = col.median();
  var mndwi = img.normalizedDifference(['B3', 'B11']).rename('MNDWI');
  var ndvi = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return mndwi.addBands(ndvi).clip(roi);
}

// Show one year on the map so you can check it
Map.addLayer(composite(2020).select('MNDWI'),
  {min: -1, max: 1, palette: ['brown', 'white', 'blue']}, 'MNDWI 2020');

// Create one export task per year
for (var y = 2018; y <= 2024; y++) {
  Export.image.toDrive({
    image: composite(y),
    description: 'demak_' + y,
    folder: 'demak_gee',
    region: roi,
    scale: 10,
    crs: 'EPSG:32749',
    maxPixels: 1e9
  });
}