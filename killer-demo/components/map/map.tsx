"use client";

import React from 'react';
import { scaleQuantize } from '@visx/scale';
import { Mercator } from '@visx/geo';
import * as topojson from "topojson-client";
import * as d3Geo from "d3-geo";
import topology from './italy_regional_topology.json';
import { animated, useSpring, useSpringValue, easings } from "@react-spring/web";
import clsx from 'clsx';
import { X } from 'lucide-react';

export const background = '#ffffff';

const AnimatedMercator = animated(Mercator<FeatureShape>);

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


const Map = ({ width, height, events = false }: GeoMercatorProps) => {
    const initialScale = (width + height) * 1.8;
    const initialCenter = [12, 42] as [number, number];

    function getGeoCentroid(feature: FeatureShape) {
        const centroid = d3Geo.geoCentroid(feature);
        return centroid
    }

    const [selectedRegion, setSelectedRegion] = React.useState<FeatureShape | null>(null);

    const italy = React.useMemo(() => {
        // @ts-expect-error
        return topojson.feature(topology, topology.objects.regions) as {
            type: 'FeatureCollection';
            features: FeatureShape[];
        };
    }, []);

    const colorScale = React.useMemo(() => scaleQuantize({
        domain: [
            Math.min(...italy.features.map((f) => f.geometry.coordinates.length)),
            Math.max(...italy.features.map((f) => f.geometry.coordinates.length)),
        ],
        range: ['#ffb01d', '#ffa020', '#ff9221', '#ff8424', '#ff7425', '#fc5e2f', '#f94b3a', '#f63a48'],
    }), [italy.features])

    const [{ transformAnim }, transformApi] = useSpring(() => ({
        transformAnim: [1, 0, 0],
    }));

    const trans = (scale: number, translateX: number, translateY: number) => `scale(${scale}) translate(${translateX}px, ${translateY}px)`

    function selectRegion(feature: FeatureShape, projection: d3Geo.GeoProjection) {
        const geoCentroid = getGeoCentroid(feature);
        const projectedCentroid = projection(geoCentroid);

        if (!projectedCentroid) return;

        const xOffset = (width / 2) - projectedCentroid[0] - 50;
        const yOffset = (height / 2) - projectedCentroid[1];

        transformApi.start({
            transformAnim: [2.5, xOffset, yOffset]
        })

        setSelectedRegion(feature);
    }

    function deselectRegion() {
        if (!selectedRegion) return;

        setSelectedRegion(null);
        transformApi.start({
            transformAnim: [1, 0, 0]
        })
    }

    return width < 10 ? null : (
        <div className='w-fit h-fit rounded-3xl bg-[#f9f7e8] overflow-hidden relative'>
            <div className={clsx("flex flex-col absolute bottom-3 right-3 rounded-3xl backdrop-blur-sm bg-white/30 shadow-md text-slate-800", {
                "hidden": !selectedRegion
            })}>
                <div className='p-8'>
                    <h1 className='text-2xl font-semibold'>
                        {selectedRegion?.properties.reg_name}
                    </h1>
                    <h2 className='text-sm font-normal mt-2'>
                        {selectedRegion?.properties.reg_istat_code}
                    </h2>
                    <p className='text-base mt-6'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                </div>
                <div className='flex flex-row mt-6 p-2 flex-1 gap-2'>
                    <button className='border-2 border-gray-900 text-gray-900 px-4 py-4 rounded-2xl' onClick={deselectRegion}>
                        <X />
                    </button>
                    <button className='bg-gray-900 text-white px-4 py-4 rounded-2xl flex-1'>
                        Show more
                    </button>
                </div>
            </div>
            <svg width={width} height={height} onClick={() => {
                deselectRegion();
            }}>
                <Mercator<FeatureShape>
                    data={italy.features}
                    center={initialCenter}
                    scale={initialScale}
                    translate={[width / 2, height / 2]}
                >
                    {(mercator) => (
                        <animated.g style={{
                            transform: transformAnim.to(trans),
                            transformOrigin: 'center center'
                        }}
                        >
                            {mercator.features.map(({ feature, path }, i) => (
                                <animated.path
                                    key={`map-feature-${i}`}
                                    d={path || ''}
                                    stroke={background}
                                    strokeWidth={0.5}
                                    cursor={"pointer"}
                                    scale={selectedRegion && selectedRegion.properties.reg_istat_code === feature.properties.reg_istat_code ? 4 : 1}
                                    fill={selectedRegion && selectedRegion.properties.reg_istat_code === feature.properties.reg_istat_code ? colorScale(feature.geometry.coordinates.length) : selectedRegion ? "#B2BEB5" : colorScale(feature.geometry.coordinates.length)}
                                    onClick={() => {
                                        selectRegion(feature, mercator.projection);
                                    }}
                                />
                            ))}
                        </animated.g>
                    )}
                </Mercator>
            </svg>
        </div>
    );
}


export default Map;

