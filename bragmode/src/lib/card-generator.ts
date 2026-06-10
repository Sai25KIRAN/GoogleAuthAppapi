import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';

let regularFontBuffer: ArrayBuffer | null = null;
let boldFontBuffer: ArrayBuffer | null = null;

async function getFonts() {
  if (!regularFontBuffer) {
    const regularUrl = 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff';
    const response = await fetch(regularUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch regular font');
    }
    regularFontBuffer = await response.arrayBuffer();
  }
  if (!boldFontBuffer) {
    const boldUrl = 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.woff';
    const response = await fetch(boldUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch bold font');
    }
    boldFontBuffer = await response.arrayBuffer();
  }
  return { regular: regularFontBuffer, bold: boldFontBuffer };
}

interface CardData {
  countryName: string;
  flag: string;
  founderNumber: number;
  worldCupWinner: string;
  goldenBoot: string;
  darkHorse: string;
  biggestFlop: string;
  hotTake: string;
  claimHash: string;
  isClaimed: boolean;
}

export async function generateCardImage(data: CardData): Promise<Buffer> {
  const { regular, bold } = await getFonts();

  const element = React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '800px',
        height: '800px',
        padding: '50px',
        backgroundColor: '#050505',
        backgroundImage: 'radial-gradient(circle at 50% 50%, #151726 0%, #050505 100%)',
        border: '12px solid #fbbf24',
        borderRadius: '36px',
        fontFamily: 'Inter',
        color: '#ffffff',
        position: 'relative',
      },
    },
    // Watermark overlay if unclaimed
    !data.isClaimed &&
      React.createElement(
        'div',
        {
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '800px',
            height: '800px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-30deg)',
            opacity: 0.1,
            zIndex: 10,
          },
        },
        React.createElement(
          'span',
          {
            style: {
              fontSize: '90px',
              fontWeight: '900',
              color: '#ffffff',
              border: '10px solid #ffffff',
              padding: '10px 40px',
              borderRadius: '20px',
            },
          },
          'UNCLAIMED PREVIEW'
        )
      ),

    // Holographic corner lights
    React.createElement('div', {
      style: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#fbbf24',
        opacity: 0.15,
        filter: 'blur(30px)',
      },
    }),
    React.createElement('div', {
      style: {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: '#f59e0b',
        opacity: 0.1,
        filter: 'blur(40px)',
      },
    }),

    // Top Header Row
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderBottom: '2px solid #1f2937',
          paddingBottom: '20px',
        },
      },
      React.createElement(
        'span',
        {
          style: {
            fontSize: '24px',
            fontWeight: '900',
            color: '#fbbf24',
            letterSpacing: '3px',
          },
        },
        'BRAGMODE'
      ),
      React.createElement(
        'span',
        {
          style: {
            fontSize: '14px',
            fontWeight: '700',
            color: data.isClaimed ? '#22c55e' : '#a3a3a3',
            border: `1px solid ${data.isClaimed ? '#22c55e' : '#4b5563'}`,
            padding: '4px 12px',
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          },
        },
        data.isClaimed ? 'Verified Founder' : 'Unclaimed Preview'
      )
    ),

    // Middle Info: Country Flag, Name, Founder Number
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '30px',
          marginBottom: '30px',
        },
      },
      React.createElement(
        'span',
        {
          style: {
            fontSize: '72px',
            marginBottom: '10px',
          },
        },
        data.flag
      ),
      React.createElement(
        'span',
        {
          style: {
            fontSize: '44px',
            fontWeight: '800',
            color: '#ffffff',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          },
        },
        data.countryName
      ),
      React.createElement(
        'span',
        {
          style: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#fbbf24',
            marginTop: '5px',
          },
        },
        `FOUNDER #${data.founderNumber}`
      )
    ),

    // Predictions Grid (Implemented via safe Satori flex layout)
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          backgroundColor: '#0a0a0c',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '24px',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: '14px',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column', width: '48%' } },
          React.createElement('span', { style: { fontSize: '12px', color: '#a3a3a3', textTransform: 'uppercase', fontWeight: 'bold' } }, 'World Cup Winner'),
          React.createElement('span', { style: { fontSize: '18px', fontWeight: '800', color: '#ffffff', marginTop: '2px' } }, data.worldCupWinner)
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column', width: '48%' } },
          React.createElement('span', { style: { fontSize: '12px', color: '#a3a3a3', textTransform: 'uppercase', fontWeight: 'bold' } }, 'Golden Boot'),
          React.createElement('span', { style: { fontSize: '18px', fontWeight: '800', color: '#ffffff', marginTop: '2px' } }, data.goldenBoot)
        )
      ),
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: '14px',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column', width: '48%' } },
          React.createElement('span', { style: { fontSize: '12px', color: '#a3a3a3', textTransform: 'uppercase', fontWeight: 'bold' } }, 'Dark Horse'),
          React.createElement('span', { style: { fontSize: '18px', fontWeight: '800', color: '#ffffff', marginTop: '2px' } }, data.darkHorse)
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column', width: '48%' } },
          React.createElement('span', { style: { fontSize: '12px', color: '#a3a3a3', textTransform: 'uppercase', fontWeight: 'bold' } }, 'Biggest Flop'),
          React.createElement('span', { style: { fontSize: '18px', fontWeight: '800', color: '#ffffff', marginTop: '2px' } }, data.biggestFlop)
        )
      ),
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            borderTop: '1px solid #1f2937',
            paddingTop: '12px',
          },
        },
        React.createElement('span', { style: { fontSize: '12px', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 'bold' } }, 'My Hot Take'),
        React.createElement(
          'span',
          {
            style: {
              fontSize: '15px',
              fontWeight: '500',
              color: '#e5e5e5',
              marginTop: '4px',
              fontStyle: 'italic',
            },
          },
          `"${data.hotTake}"`
        )
      )
    ),

    // Footer with Verification details and Claim hash (if claimed)
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          marginTop: '20px',
        },
      },
      React.createElement(
        'span',
        {
          style: {
            fontSize: '10px',
            color: '#4b5563',
            fontFamily: 'monospace',
            textAlign: 'center',
          },
        },
        data.isClaimed ? `CLAIM HASH: ${data.claimHash}` : 'PREVIEW STATUS: PENDING CLAIM'
      )
    )
  );

  const svg = await satori(element, {
    width: 800,
    height: 800,
    fonts: [
      {
        name: 'Inter',
        data: regular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: bold,
        weight: 800,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    background: '#050505',
    fitTo: {
      mode: 'width',
      value: 800,
    },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}
