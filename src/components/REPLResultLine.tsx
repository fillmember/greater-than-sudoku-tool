import { FC, useEffect, useMemo, useState } from "react";
import { FaAngleRight, FaAngleDown, FaArrowRight } from "react-icons/fa";
import clsx from "clsx";
import noop from "lodash/noop";
import uniq from "lodash/uniq";

export const ResultLine: FC<{
  name: string;
  formations: number[][][];
  onItemClick?: (args: { name: string; groupIndex: number }) => void;
}> = ({ name, formations, onItemClick = noop }) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [touched, setTouched] = useState<boolean>(false);
  const len = formations.length;
  const needsTruncation = len > 0;
  useEffect(() => {
    if (needsTruncation && !touched) {
      // should be folded by default
      setExpanded(false);
    }
  }, [needsTruncation, len, expanded, touched]);
  const toggleLineFolding = () => {
    setExpanded((v) => !v);
    setTouched(true);
  };
  const possibilitiesEachGroup: string[][] = useMemo(() => {
    if (formations.length === 0) return [];
    return formations[0].map((_, groupIndex) => uniq(formations.map((x) => x[groupIndex]).map((x) => x.join(""))).sort());
  }, [formations]);
  return (
    <div key={name} className={clsx("flex mb-1", len === 0 && "text-red-600", len === 1 && "text-green-500")}>
      <div className="w-4 shrink-0">
        {needsTruncation && formations.length > 1 && (
          <button className="mt-px" onClick={toggleLineFolding}>
            {expanded ? <FaAngleDown /> : <FaAngleRight />}
          </button>
        )}
      </div>
      <div className="w-12 shrink-0">{name}</div>
      <div className="w-8 shrink-0">{formations.length}</div>
      <ul className="flex-grow">
        <li>
          {formations.length > 0 &&
            formations[0].map((_, groupIndex, groupArr) => {
              const possibilities = possibilitiesEachGroup[groupIndex];
              return (
                <>
                  <button key={groupIndex} className="hover:underline" onClick={() => onItemClick({ name, groupIndex })}>
                    {possibilities.length <= 20 && (
                      <>
                        [
                        {possibilities.map((x, j, arr) => (
                          <>
                            <span key={j} className={clsx(possibilities.length === 1 && "text-green-500")}>
                              {x}
                            </span>
                            {j + 1 < arr.length ? "," : ""}
                          </>
                        ))}
                        ]
                      </>
                    )}
                    {possibilities.length > 20 && (
                      <span className="italic text-gray-700">
                        {possibilities[0]
                          .split("")
                          .map(() => ".")
                          .join("")}
                      </span>
                    )}
                  </button>
                  {groupIndex + 1 < groupArr.length ? "-" : ""}
                </>
              );
            })}
        </li>
        {expanded &&
          1 < len &&
          formations.map((f, formationIndex) => (
            <li key={formationIndex}>
              {f
                .map((b) => b.join(""))
                .map((b, groupIndex) => (
                  <span key={b + groupIndex}>
                    <button className="hover:underline" onClick={() => onItemClick({ name, groupIndex })}>
                      {b}
                    </button>
                    {groupIndex !== f.length - 1 && <>-</>}
                  </span>
                ))}
            </li>
          ))}
        {len === 0 && <li>no formations found</li>}
      </ul>
      <div className="shrink-0">
        <button
          className="hover:underline"
          onClick={(evt) => {
            const txt = `${name} = ${possibilitiesEachGroup
              .map((x) =>
                x.length < 10
                  ? `[${x.toString()}]`
                  : x[0]
                      .split("")
                      .map(() => ".")
                      .join("")
              )
              .join("-")}`;
            navigator.clipboard.writeText(txt);
          }}
        >
          copy
        </button>
      </div>
    </div>
  );
};
