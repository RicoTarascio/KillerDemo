"use client";

import React from 'react';
import { scaleQuantize } from '@visx/scale';
import { Mercator } from '@visx/geo';
import * as topojson from "topojson-client";
import * as d3Geo from "d3-geo";
import topology from './italy_regional_topology.json';

export const background = '#ffffff';

export type GeoMercatorProps = {
    width: number;
    height: number;
    events?: boolean;
};

interface FeatureShape {
    type: 'Feature';
    geometry: { coordinates: [number, number][][]; type: 'Polygon' };
    properties: { reg_name: string; reg_istat_code_num: number; reg_istat_code: string };
}

// @ts-expect-error
const italy = topojson.feature(topology, topology.objects.regions) as {
    type: 'FeatureCollection';
    features: FeatureShape[];
};

const color = scaleQuantize({
    domain: [
        Math.min(...italy.features.map((f) => f.geometry.coordinates.length)),
        Math.max(...italy.features.map((f) => f.geometry.coordinates.length)),
    ],
    range: ['#ffb01d', '#ffa020', '#ff9221', '#ff8424', '#ff7425', '#fc5e2f', '#f94b3a', '#f63a48'],
});

const Map = ({ width, height, events = false }: GeoMercatorProps) => {
    const [currentCenter, setCurrentCenter] = React.useState<[number, number]>([12, 42]);
    const [currentScale, setCurrentScale] = React.useState<number>((width + height) * 1.8);

    function getGeoCentroid(feature: FeatureShape) {
        const centroid = d3Geo.geoCentroid(feature);
        return centroid
    }

    return width < 10 ? null : (
        <svg width={width} height={height}>
            <rect x={0} y={0} width={width} height={height} fill={background} rx={14} />
            <Mercator<FeatureShape>
                data={italy.features}
                scale={currentScale}
                center={currentCenter}
                translate={[width / 2, height / 2]}
            >
                {(mercator) => (
                    <g>
                        {mercator.features.map(({ feature, path }, i) => (
                            <path
                                key={`map-feature-${i}`}
                                d={path || ''}
                                fill={color(feature.geometry.coordinates.length)}
                                stroke={background}
                                strokeWidth={0.5}
                                onClick={() => {
                                    setCurrentCenter(getGeoCentroid(feature));
                                    setCurrentScale((width + height) * 3.5);
                                    if (events) alert(`Clicked: ${feature.properties.reg_name} (${feature.properties.reg_istat_code})`);
                                }}
                            />
                        ))}
                    </g>
                )}
            </Mercator>
        </svg>
    );
}


export default Map;
