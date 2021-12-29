import { FC, useEffect, useState } from "react";
import { FaAngleLeft, FaAngleDown } from "react-icons/fa";
import clsx from "clsx";

export const ResultLine: FC<{ name: string; formations: number[][][] }> = ({ name, formations }) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [touched, setTouched] = useState<boolean>(false);
  const len = formations.length;
  const needsTruncation = len > 8;
  useEffect(() => {
    if (needsTruncation && !touched) {
      // should be folded by default
      setExpanded(false);
    }
    if (len === 1) {
      setExpanded(true);
    }
  }, [needsTruncation, len, expanded, touched]);
  return (
    <div key={name} className={clsx("grid grid-cols-12 gap-4", len === 0 && "text-red-600", len === 1 && "text-green-500")}>
      <span className="col-span-1">{name}</span>
      <span className="col-span-2 text-right truncate">{formations.length}</span>
      <ul className="col-span-8">
        {formations.slice(0, !needsTruncation || expanded ? len + 1 : 2).map((f, i) => (
          <li key={i}>{f.map((b) => b.join("")).join("-")}</li>
        ))}
        {needsTruncation && !expanded && <li className="text-gray-600">...{len - 2} more</li>}
        {len === 0 && <li>no formations found</li>}
      </ul>
      {needsTruncation && (
        <div className="col-span-1 text-right">
          <button
            onClick={() => {
              setExpanded((v) => !v);
              setTouched(true);
            }}
          >
            {expanded ? <FaAngleDown /> : <FaAngleLeft />}
          </button>
        </div>
      )}
    </div>
  );
};
