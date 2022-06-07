import { FC, useMemo } from "react";
import { IoMdCopy, IoMdPrint, IoMdArrowForward } from "react-icons/io";
import clsx from "clsx";
import noop from "lodash/noop";
import uniq from "lodash/uniq";
import inRange from "lodash/inRange";
import padStart from "lodash/padStart";

const clsActionBtn = "inline-block p-1 hover:bg-black hover:text-white rounded";

export const ResultLine: FC<{
  name: string;
  formations: number[][][];
  onItemClick?: (args: { name: string; groupIndex: number }) => void;
  onPrint?: (args: { name: string }) => void;
}> = ({ name, formations, onItemClick = noop, onPrint = noop }) => {
  const len = formations.length;
  const possibilitiesEachGroup: string[][] = useMemo(() => {
    if (len === 0) return [];
    return formations[0].map((_, groupIndex) => uniq(formations.map((x) => x[groupIndex]).map((x) => x.join(""))).sort());
  }, [len, formations]);
  return (
    <div key={name} className={clsx("flex", len === 0 && "text-red-600", len === 1 && "text-green-500")}>
      <div className="shrink-0 pr-2">
        {name}
        <IoMdArrowForward className="inline-block text-sm text-gray-500" />
        {padStart(len.toString(), 2, "0")}
      </div>
      <ul className="flex-grow">
        <li>
          {len > 0 &&
            formations[0].map((_, groupIndex, groupArr) => {
              const possibilities = possibilitiesEachGroup[groupIndex];
              return (
                <>
                  <button key={groupIndex} className="hover:underline" onClick={() => onItemClick({ name, groupIndex })}>
                    {possibilities.length <= 20 && (
                      <>
                        {possibilities.length > 1 && "["}
                        {possibilities.map((x, j, arr) => (
                          <>
                            <span key={j} className={clsx(possibilities.length === 1 && "text-green-500")}>
                              {x}
                            </span>
                            {j + 1 < arr.length ? "," : ""}
                          </>
                        ))}
                        {possibilities.length > 1 && "]"}
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
        {inRange(len, 2, 10) &&
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
      <div className="shrink-0 text-lg">
        <button
          className={clsActionBtn}
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
          <IoMdCopy />
        </button>
        <button className={clsActionBtn} onClick={() => onPrint({ name })}>
          <IoMdPrint />
        </button>
      </div>
    </div>
  );
};
