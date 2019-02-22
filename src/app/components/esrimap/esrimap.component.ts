import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types
import * as vars from './variables';

@Component({
  selector: 'app-esrimap',
  templateUrl: './esrimap.component.html',
  styleUrls: ['./esrimap.component.css']
})
export class EsrimapComponent implements OnInit {
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;
  private _zoom = 12;
  private _center: Array<number> = [-95.118420276135581, 31.072854453305986];
  private _basemap = 'streets';
  constructor() { }

  async initializeMap() {

    const [EsriMap, EsriMapView, GraphicsLayer, Graphic, Polyline, Point, geometryEngine] = await loadModules([
      'esri/Map', 'esri/views/MapView',  'esri/layers/GraphicsLayer',   'esri/Graphic',
      'esri/geometry/Polyline',  'esri/geometry/Point',    'esri/geometry/geometryEngine',
      'dojo/domReady'
    ]);

    const map: esri.Map = new EsriMap({ basemap: this._basemap });

    // Initialize the MapView
    const mapViewProperties: esri.MapViewProperties = {
      container: this.mapViewEl.nativeElement,
      center: this._center,
      zoom: this._zoom,
      map: map
    };

    const mapView = new EsriMapView(mapViewProperties);
    const line = new Polyline({
      paths: vars.line1,
      spatialReference: { wkid: 4326 }
    });

    const lineGraphic = new Graphic({
      geometry: line,
      symbol: vars.lineGraphicSymbol
    });

    const lineLayer = new GraphicsLayer();
    const ptLayer = new GraphicsLayer();
    const labelsLayer = new GraphicsLayer();
lineLayer.add(lineGraphic);
    map.addMany([ptLayer, lineLayer, labelsLayer]);


    // function animate() {
    //   let i = 0;
    //   const totalStops = ptGraphicsArray.length;
    //   function f() {
    //     ptLayer.removeAll();
    //     const newpaths = [ptArray.slice(i, i + 2)];
    //     const line1 = new Polyline({
    //       paths: newpaths,
    //       spatialReference: { wkid: 4326 }
    //     });
    //     const lineGraphic1 = new Graphic({
    //       geometry: line1,
    //       symbol: vars.highLightedLineSymbol
    //     });
    //     lineLayer.add(lineGraphic1);
    //     ptLayer.add(ptGraphicsArray[i]);
    //     i++;
    //     if (i < totalStops) {
    //       setTimeout(f, 1);
    //     } else {
    //       console.log('done');
    //     }
    //   }
    //   f();
    // }

    // need to count total points between nodes
    // console.log(geometryEngine.geodesicLength(line));
    // const ptGraphicsArray = [];
    // const ptArray = [];
    // for (let ii = 0.005; ii < 25; ii += 0.0008) {
    //   const c = vars.getPointAlongLine(line, ii, 0);
    //   if (c !== null) {
    //     const ptGraphic = new Graphic({
    //       symbol: vars.markerSymbol,
    //       geometry: {
    //         type: 'point',
    //         longitude: c[0],
    //         latitude: c[1],
    //       }
    //     });
    //     ptGraphicsArray.push(ptGraphic);
    //     ptArray.push([c[0], c[1]]);
    //   } else {
    //     break;
    //   }
    // }
   // ptLayer.addMany(ptGraphicsArray);

   // animate();

   const totalPaths = vars.line1.length;
   let legNumber = 1; // first leg
   let legHop = 0;
   const distanceLat = 0.0005;
   const allPtGraphics = [];
   const allPtArray = [];

   function prepareForAnimation(polyline) {
    //  console.log(polyline);
     // loop for the all paths inside that polyline
     for (let pthId = 0; pthId < polyline.paths.length; pthId++) {
        // get total hops per individual path sections
        const countPerleg = getTotalHopsMaster(pthId);
        console.log(countPerleg);
        // now get all those points
        const ptArraySection = [];
        const ptGraphicsArraySection = [];
        for (let hop = 0; hop <= countPerleg ; hop++) {
           const c = vars.getPointAlongLine(polyline, (hop + 1 ) * distanceLat, pthId);
          if (c !== null) {
            const ptGraphic = new Graphic({
              symbol: vars.markerSymbol,
              geometry: {
                type: 'point',
                longitude: c[0],
                latitude: c[1],
                spatialReference: {wkid: 4326}
              }
            });
            ptGraphicsArraySection.push(ptGraphic);
            ptArraySection.push([c[0], c[1]]);
            // console.log(c);
          } else {
            hop = countPerleg + 5;
          }
        }
        console.log(pthId, ptArraySection);
        allPtArray.push(ptArraySection);
        allPtGraphics.push(ptGraphicsArraySection);
     }
    // labelsLayer.addMany(allPtGraphics[0]);
    // console.log(allPtArray);
    // const _line1 = new Polyline({
    //   paths: allPtArray,
    //   spatialReference: { wkid: 4326 }
    // });
    // const _lineGraphic1 = new Graphic({
    //   geometry: _line1,
    //   symbol: vars.highLightedLineSymbol
    // });
    // lineLayer.add(_lineGraphic1);
     animateAll();
   }


    function getTotalHops(id) {
      // return 200;
      // const count = countPointsPerLine(vars.line1[id ], 1000);
      // return count;
      return allPtArray[id].length;
    }

   function getTotalHopsMaster(id) {
        const count = countPointsPerLine(vars.line1[id ], 10);
      return count;
    }

    function get(n, h) {
      return vars.getPointAlongLine(line, 0.00005 * (legHop), n);
    }

function addLabel(legNumber) {
  const newLabel = '';
//  labelsLayer.add(null);
}

    function animateAll() {
      legHop++;
      // console.log('master leg', legNumber, legHop);
      // animation logic
      ptLayer.removeAll();
      // console.log(allPtArray[legNumber - 1]);
      const newpaths = [allPtArray[legNumber - 1].slice(legHop - 1, legHop + 1)];
      // console.log(newpaths);
      const line1 = new Polyline({
        paths: newpaths,
        spatialReference: { wkid: 4326 }
      });
      const lineGraphic1 = new Graphic({
        geometry: line1,
        symbol: vars.highLightedLineSymbol
      });
      lineLayer.add(lineGraphic1);
      map.add(lineLayer);
      console.log(allPtGraphics[legNumber - 1][legHop - 1], legHop, getTotalHops(legNumber - 1), legNumber);
      ptLayer.add(allPtGraphics[legNumber - 1][legHop - 1]);
    //  console.log(allPtGraphics[0]);
      /* animation logic */
      if (legNumber < totalPaths) {
        if (legHop > (getTotalHops(legNumber - 1) - 1 ) && legNumber <= totalPaths) {
          legNumber++;
          console.log('leg number increased');
          legHop = 0;
          ptLayer.removeAll();
          addLabel(legNumber - 1);
          setTimeout(animateAll, 3);
        } else if (legHop >= getTotalHops(legNumber - 1) && legNumber > totalPaths) {
          return;
        } else {
          setTimeout(animateAll, 3);
        }
      } else if (legHop < getTotalHops(legNumber - 1)) {
        setTimeout(animateAll, 3);
      }
    }
    const _polyline = new Polyline({
      paths: vars.line1,
      spatialReference: { wkid: 4326 }
    });
    prepareForAnimation(_polyline);

    function countPointsPerLine(polylinePath, distance) {
      const pl = new Polyline({
        paths: polylinePath,
        spatialReference: { wkid: 4326 }
      });
      console.log(geometryEngine.geodesicLength(pl, 'meters'), distance);
      return Math.round(geometryEngine.geodesicLength(pl, 'meters') / distance);
    }
    return mapView;
  }

  ngOnInit() {
    this.initializeMap();
  }

}
