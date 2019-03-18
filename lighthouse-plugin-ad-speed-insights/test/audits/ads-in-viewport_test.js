// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const AdsInViewport = require('../../audits/ads-in-viewport');
const {expect} = require('chai');

describe('AdsInViewport', () => {
  // From top left corner & dimensions
  const generateSlot = ({x, y, w, h}) =>
    ({content: [x, y, x + w, y, x + w, y + h, x, y + h], id: 'slot'});

  const ViewportDimensions = {
    innerHeight: 200,
    innerWidth: 300,
  };

  describe('rawValue', () => {
    it('should succeed if there are no ad slots', async () => {
      const RenderedAdSlots = [];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', true);
    });

    it('should return fraction of ad slots inside viewport', async () => {
      const RenderedAdSlots = [
        generateSlot({x: 0, y: 100, w: 50, h: 50}), // in
        generateSlot({x: 0, y: 700, w: 50, h: 50}), // out
        generateSlot({x: 0, y: 800, w: 50, h: 50}), // out
        null, null, // hidden
      ];

      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 1 / 3);
    });

    const positiveTests = [
      {x: 10, y: 10, w: 10, h: 10, overlap: 100, pos: 'inside'},
      // Cases overlapping an edge of the viewport
      {x: -10, y: 0, w: 20, h: 200, overlap: 2000, pos: 'left edge'},
      {x: 0, y: -10, w: 300, h: 20, overlap: 3000, pos: 'top edge'},
      {x: 290, y: 0, w: 20, h: 200, overlap: 2000, pos: 'right edge'},
      {x: 0, y: 190, w: 300, h: 20, overlap: 3000, pos: 'bottom edge'},
      // Cases overlapping a corner of the viewport
      {x: -10, y: -10, w: 20, h: 20, overlap: 100, pos: 'top left corner'},
      {x: 290, y: -10, w: 20, h: 20, overlap: 100, pos: 'top right corner'},
      {x: -10, y: 190, w: 20, h: 20, overlap: 100, pos: 'bottom left corner'},
      {x: 290, y: 190, w: 20, h: 20, overlap: 100, pos: 'bottom right corner'},
    ];

    positiveTests.forEach(async (test) =>
      it(`should handle slots on the ${test.pos} properly`, () => {
        const RenderedAdSlots = [generateSlot(test)];
        const artifacts = {RenderedAdSlots, ViewportDimensions};
        expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 1);
      })
    );

    const negativeTests = [
      // Cases outside an edge of the viewport
      {x: -20, y: 0, w: 20, h: 200, pos: 'left edge'},
      {x: 0, y: -20, w: 300, h: 20, pos: 'top edge'},
      {x: 300, y: 0, w: 20, h: 200, pos: 'right edge'},
      {x: 0, y: 200, w: 300, h: 20, pos: 'bottom edge'},
      // Cases outside a corner of the viewport
      {x: -20, y: -20, w: 20, h: 20, pos: 'top left corner'},
      {x: 300, y: -20, w: 20, h: 20, pos: 'top right corner'},
      {x: -20, y: 200, w: 20, h: 20, pos: 'bottom left corner'},
      {x: 300, y: 200, w: 20, h: 20, pos: 'bottom right corner'},
    ];

    negativeTests.forEach(async (test) =>
      it(`should handle slots outside the ${test.pos}`, () => {
        const RenderedAdSlots = [generateSlot(test)];
        const artifacts = {RenderedAdSlots, ViewportDimensions};
        expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 0);
      })
    );

    it('should handle slots that have no area', async () => {
      const RenderedAdSlots = [generateSlot({x: 10, y: 10, w: 0, h: 0})];
      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts)).to.have.property('rawValue', 0);
    });

    it('should not be applicable if all slots are hidden', async () => {
      const RenderedAdSlots = [null, null]; // no box model if slot is hidden
      const artifacts = {RenderedAdSlots, ViewportDimensions};
      expect(AdsInViewport.audit(artifacts))
          .to.have.property('notApplicable', true);
    });
  });
});