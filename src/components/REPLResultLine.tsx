import { FC, useEffect, useMemo, useState } from "react";
import { FaAngleLeft, FaAngleDown, FaArrowRight } from "react-icons/fa";
import clsx from "clsx";
import noop from "lodash/noop";
import { arsig } from "../logic";

export const ResultLine: FC<{
  name: string;
  formations: number[][][];
  onItemClick?: (args: { name: string; groupIndex: number }) => void;
}> = ({ name, formations, onItemClick = noop }) => {
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
  const toggleLineFolding = () => {
    setExpanded((v) => !v);
    setTouched(true);
  };
  const groupsToHighlight = useMemo(() => {
    if (formations.length === 0) return [];
    return formations[0].map((group, groupIndex) => {
      const sig0 = arsig(group);
      return formations.every((form) => arsig(form[groupIndex]) === sig0);
    });
  }, [formations]);
  return (
    <div key={name} className={clsx("grid grid-cols-12 gap-4", len === 0 && "text-red-600", len === 1 && "text-green-500")}>
      <span className="col-span-2 truncate">
        {name} <FaArrowRight className="inline" /> {formations.length}
      </span>
      <ul className="col-span-9">
        {formations.slice(0, !needsTruncation || expanded ? len + 1 : 2).map((f, formationIndex) => (
          <li key={formationIndex}>
            {f
              .map((b) => b.join(""))
              .map((b, groupIndex) => (
                <span key={b + groupIndex}>
                  <button
                    className={clsx("hover:underline", groupsToHighlight[groupIndex] && "text-green-500")}
                    onClick={() => onItemClick({ name, groupIndex })}
                  >
                    {b}
                  </button>
                  {groupIndex !== f.length - 1 && <>-</>}
                </span>
              ))}
          </li>
        ))}
        {needsTruncation && !expanded && (
          <li className="text-gray-600">
            <button onClick={toggleLineFolding}>...{len - 2} more</button>
          </li>
        )}
        {len === 0 && <li>no formations found</li>}
      </ul>
      {needsTruncation && (
        <div className="col-span-1 text-right">
          <button onClick={toggleLineFolding}>{expanded ? <FaAngleDown /> : <FaAngleLeft />}</button>
        </div>
      )}
    </div>
  );
};