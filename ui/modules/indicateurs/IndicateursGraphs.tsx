interface IndicateursGraphsProps {
  error?: string;
  iframeUrl?: string;
}
function IndicateursGraphs(props: IndicateursGraphsProps) {
  return <>{props.error ?? <iframe src={props.iframeUrl} style={{ height: "1600px", width: "100%" }} seamless />}</>;
}

export default IndicateursGraphs;
