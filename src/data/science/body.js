export const BODY_REGIONS = [
  // === ORGANS ===
  {
    id: "brain",
    name: "Brain",
    dataset: "organs",
    shape: { type: "ellipse", cx: 120, cy: 42, rx: 28, ry: 22 },
    fact: "Contains roughly 86 billion neurons and uses about 20% of the body's energy."
  },
  {
    id: "heart",
    name: "Heart",
    dataset: "organs",
    shape: { type: "ellipse", cx: 108, cy: 148, rx: 16, ry: 18 },
    fact: "Beats about 100,000 times per day, pumping 7,500 litres of blood."
  },
  {
    id: "left_lung",
    name: "Left Lung",
    dataset: "organs",
    shape: { type: "ellipse", cx: 88, cy: 152, rx: 18, ry: 30 },
    fact: "The left lung is slightly smaller than the right to make room for the heart."
  },
  {
    id: "right_lung",
    name: "Right Lung",
    dataset: "organs",
    shape: { type: "ellipse", cx: 148, cy: 152, rx: 18, ry: 30 },
    fact: "The right lung has three lobes while the left has two."
  },
  {
    id: "liver",
    name: "Liver",
    dataset: "organs",
    shape: { type: "ellipse", cx: 140, cy: 195, rx: 22, ry: 18 },
    fact: "The largest internal organ, performing over 500 functions including detoxification."
  },
  {
    id: "stomach",
    name: "Stomach",
    dataset: "organs",
    shape: { type: "ellipse", cx: 105, cy: 200, rx: 18, ry: 20 },
    fact: "Produces hydrochloric acid strong enough to dissolve metal."
  },
  {
    id: "left_kidney",
    name: "Left Kidney",
    dataset: "organs",
    shape: { type: "ellipse", cx: 88, cy: 215, rx: 10, ry: 14 },
    fact: "Filters about 180 litres of blood per day to produce roughly 1.5 litres of urine."
  },
  {
    id: "right_kidney",
    name: "Right Kidney",
    dataset: "organs",
    shape: { type: "ellipse", cx: 152, cy: 215, rx: 10, ry: 14 },
    fact: "The right kidney sits slightly lower than the left due to the liver above it."
  },
  {
    id: "large_intestine",
    name: "Large Intestine",
    dataset: "organs",
    shape: { type: "ellipse", cx: 120, cy: 248, rx: 38, ry: 22 },
    fact: "About 1.5 metres long and home to trillions of beneficial bacteria."
  },

  // === BONES ===
  {
    id: "skull",
    name: "Skull",
    dataset: "bones",
    shape: { type: "ellipse", cx: 120, cy: 30, rx: 32, ry: 26 },
    fact: "Made up of 22 separate bones fused together to protect the brain."
  },
  {
    id: "left_clavicle",
    name: "Left Clavicle",
    dataset: "bones",
    shape: { type: "rect", x: 62, y: 97, width: 46, height: 7 },
    fact: "The clavicle is the most frequently fractured bone in the human body."
  },
  {
    id: "right_clavicle",
    name: "Right Clavicle",
    dataset: "bones",
    shape: { type: "rect", x: 132, y: 97, width: 46, height: 7 },
    fact: "Acts as a strut connecting the shoulder blade to the sternum."
  },
  {
    id: "sternum",
    name: "Sternum",
    dataset: "bones",
    shape: { type: "rect", x: 110, y: 100, width: 20, height: 80 },
    fact: "Connects the ribs via cartilage to form the front of the ribcage."
  },
  {
    id: "left_humerus",
    name: "Left Humerus",
    dataset: "bones",
    shape: { type: "rect", x: 24, y: 104, width: 12, height: 90 },
    fact: "The upper arm bone that articulates with the shoulder and elbow joints."
  },
  {
    id: "right_humerus",
    name: "Right Humerus",
    dataset: "bones",
    shape: { type: "rect", x: 204, y: 104, width: 12, height: 90 },
    fact: "The humerus carries the radial nerve along a groove on its posterior surface."
  },
  {
    id: "left_radius",
    name: "Left Radius",
    dataset: "bones",
    shape: { type: "rect", x: 22, y: 200, width: 8, height: 70 },
    fact: "The shorter of the two forearm bones, on the thumb side."
  },
  {
    id: "right_radius",
    name: "Right Radius",
    dataset: "bones",
    shape: { type: "rect", x: 210, y: 200, width: 8, height: 70 },
    fact: "Rotates around the ulna to allow the forearm to pronate and supinate."
  },
  {
    id: "pelvis",
    name: "Pelvis",
    dataset: "bones",
    shape: { type: "rect", x: 66, y: 240, width: 108, height: 34 },
    fact: "The basin-shaped bony structure that supports the spine and protects abdominal organs."
  },
  {
    id: "left_femur",
    name: "Left Femur",
    dataset: "bones",
    shape: { type: "rect", x: 69, y: 278, width: 16, height: 120 },
    fact: "The longest and strongest bone in the human body."
  },
  {
    id: "right_femur",
    name: "Right Femur",
    dataset: "bones",
    shape: { type: "rect", x: 155, y: 278, width: 16, height: 120 },
    fact: "The femur can support up to 30 times a person's body weight."
  },
  {
    id: "left_tibia",
    name: "Left Tibia",
    dataset: "bones",
    shape: { type: "rect", x: 71, y: 400, width: 14, height: 65 },
    fact: "The shin bone; the second largest bone in the body."
  },
  {
    id: "right_tibia",
    name: "Right Tibia",
    dataset: "bones",
    shape: { type: "rect", x: 155, y: 400, width: 14, height: 65 },
    fact: "Bears most of the body weight when standing and walking."
  },
];
