# snow in gmba
Google Earth Engine scripts to add snow statistics to Global Mountain Biodiversity Assessment (GMBA) polygons (**work in progress**)

- `snowProba.js` ([source](snowProba.js)): this script computes the mean annual "snow probability" from MOD10A1 and adds derived spatial statistics to every GMBA polygon. A snow probability is the ratio of the number of snow days to the number of clear-sky days. Here the snow probability is computed by hydrological year and expressed in days per year. The script exports the mean, standard deviation and pixel count for every hydrological year and also their averages over the entire period (Fig. 1, Fig. 2). Hydrological years begin on Sep 01 (North hemisphere polygons) or Mar 01 (South hemisphere polygons). Output file naming: `snowProba_zminzmax_yminymax.csv` (`zmin`, `zmax`: elevation range, `ymin`, `ymax`: beginning year of the first and last hydrological year). 

- `peakSwe.js` ([source](peakSwe.js)): this script extracts the annual "peak SWE" from ERA5-Land and adds derived spatial statistics to every GMBA polygon. Peak SWE is defined as the SWE value on Oct 01 (South hemisphere polygons) or Apr 01 (North hemisphere polygons) and expressed in meters. The script exports the mean, standard deviation and pixel count for every hydrological year and also their averages over the period (years given in the filename). (Fig. 3). Output file naming: `peakSwe_yminymax.csv` (`zmin`, `zmax`: elevation range, `ymin`, `ymax`: first and last year of the period). 

  The output tables can be downloaded here: [https://drive.google.com/drive/folders/1sdy7m6pqYhM-pGBwa4VFLVVuCNBzZj1I](https://drive.google.com/drive/folders/1sdy7m6pqYhM-pGBwa4VFLVVuCNBzZj1I)
  
  The mean snow probability can be visualized here: [https://sgascoin.users.earthengine.app/view/snow-in-gmba](https://sgascoin.users.earthengine.app/view/snow-in-gmba)

### Fig. 1: snow probability - all elevations

<img src="https://github.com/sgascoin/snow-in-gmba/assets/29677722/eea5a9cb-4836-49ad-877d-bbe71190482b" width="800" />

### Fig. 2: snow probability - 2000-2500 m elevation range

<img src="https://github.com/sgascoin/snow-in-gmba/assets/29677722/e9bd919d-20e9-4aec-b019-160cdd1403ba" width="800" />

### Fig. 3: peak SWE (SWE on Apr/Oct 1st)

<img src="https://github.com/sgascoin/snow-in-gmba/assets/29677722/074788d4-6bcf-48c0-b712-feea8aeed8d2" width="800" />

## Note
This is a contribution to IACS joint body on mountain snow cover, working group 2 

## References 

Snethlage, M.A., Geschke, J., Spehn, E.M., Ranipeta, A., Yoccoz, N.G., Körner, Ch., Jetz, W., Fischer, M. & Urbach, D. A hierarchical inventory of the world’s mountains for global comparative mountain science. Nature Scientific Data. https://doi.org/10.1038/s41597-022-01256-y (2022).
Dataset

Snethlage, M.A., Geschke, J., Spehn, E.M., Ranipeta, A., Yoccoz, N.G., Körner, Ch., Jetz, W., Fischer, M. & Urbach, D. GMBA Mountain Inventory v2. GMBA-EarthEnv. https://doi.org/10.48601/earthenv-t9k2-1407 (2022).

Muñoz Sabater, J. (2019): ERA5-Land hourly data from 1950 to present. Copernicus Climate Change Service (C3S) Climate Data Store (CDS). https://doi.org/10.24381/cds.e2161bac. Date Accessed 04-24-2024. 

Hall, D. K. and G. A. Riggs. (2021). MODIS/Terra Snow Cover Daily L3 Global 500m SIN Grid, Version 61 [Data Set]. Boulder, Colorado USA. NASA National Snow and Ice Data Center Distributed Active Archive Center. https://doi.org/10.5067/MODIS/MOD10A1.061. Date Accessed 04-24-2024.
