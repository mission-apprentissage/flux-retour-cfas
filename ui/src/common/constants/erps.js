export const ERP_STATE = {
  ready: "ready",
  ongoing: "ongoing",
  coming: "coming",
};

export const ERP_STATE_COLOR = {
  [ERP_STATE.ready]: "#417DC4",
  [ERP_STATE.ongoing]: "#C3992A",
  [ERP_STATE.coming]: "#BD987A",
};

export const ERPS = [
  { name: "Gesti", state: ERP_STATE.ready },
  { name: "Ymag", state: ERP_STATE.ready },
  { name: "SC Form", state: ERP_STATE.ready },
  { name: "FCA Manager", state: ERP_STATE.ongoing },
  { name: "Hyperplanning", state: ERP_STATE.coming },
  { name: "Valsoftware", state: ERP_STATE.coming },
];
