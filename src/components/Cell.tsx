import { FC } from "react";
import clsx from "clsx";
import { block, column, digits, row } from "../logic";

export const CellInput: FC<{
  index: number;
  value: string;
  possibility: number[];
  onChange: (value: string) => void;
  navigate?: (direction: string) => void;
}> = ({ index, value, possibility, onChange, navigate = () => {} }) => {
  const _block = block(index);
  return (
    <div className={clsx("relative w-12 h-12", _block % 2 ? "bg-gray-100" : "bg-white")}>
      <ul className="absolute w-full h-full text-xs text-gray-200 text-center grid grid-cols-3">
        {digits.map((d) => (
          <li key={d} className={clsx(possibility.indexOf(d) > -1 && "text-gray-400")}>
            {d}
          </li>
        ))}
      </ul>
      <input
        className="cell-input absolute w-full h-full text-xl text-center focus:outline-none focus:bg-blue-200 bg-opacity-50 bg-transparent"
        type="text"
        value={value === "0" ? "" : value}
        onFocus={(evt) => {
          evt.currentTarget.select();
        }}
        onKeyUp={({ ctrlKey, key }) => {
          if (["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].indexOf(key) > -1) {
            navigate(key);
            return;
          }
          if (key === "Backspace") {
            onChange("0");
            if (ctrlKey) {
              navigate("ArrowLeft");
            }
            return;
          }
          if (digits.map(String).indexOf(key) === -1) return;
          onChange(key);
          if (ctrlKey) {
            navigate("ArrowRight");
          }
        }}
        data-block={_block}
        data-row={row(index)}
        data-column={column(index)}
      />
    </div>
  );
};
