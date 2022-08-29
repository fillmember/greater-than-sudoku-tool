import type { Formation, RecordOfFormations } from "types";
import { FC, useMemo } from "react";
import { IoMdCopy, IoMdPrint } from "react-icons/io";
import clsx from "clsx";
import noop from "lodash/noop";
import uniq from "lodash/uniq";
import padStart from "lodash/padStart";
import { has } from "lodash";

const clsActionBtn = "inline-block hover:bg-black hover:text-white mx-0.5 p-0.5";

export const ResultLine: FC<{
  name: string;
  formations: Formation;
  data: RecordOfFormations;
  onItemClick?: (args: { name: string; groupIndex: number }) => void;
  onPrint?: (args: { name: string }) => void;
}> = ({ name, formations, data, onItemClick = noop, onPrint = noop }) => {
  const len = formations.length;
  const possibilitiesEachGroup: string[][] = useMemo(() => {
    if (len === 0) return [];
    return formations[0].map((_, groupIndex) => uniq(formations.map((x) => x[groupIndex]).map((x) => x.join(""))).sort());
  }, [len, formations]);
  return (
    <div
      key={name}
      className={clsx("flex items-start", len === 0 && "text-red-600", len === 1 && "text-green-600 bg-green-50", len > 1 && "bg-cyan-50")}
    >
      <div className="shrink-0 flex items-center mr-1">
        <span className="mr-1">
          {name} {padStart(len.toString(), 2, "0")}
        </span>
        <button
          className={clsActionBtn}
          onClick={() => {
            const txt = `${name} = ${possibilitiesEachGroup
              .map((x) =>
                x.length <= 20
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
      <ul className="flex-grow">
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
                          <span key={j} className={clsx(possibilities.length === 1 && "text-green-600")}>
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
        {len === 0 && <li>no formations found</li>}
      </ul>
    </div>
  );
};
