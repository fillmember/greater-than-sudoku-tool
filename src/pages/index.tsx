import type { NextPage } from "next";
import { useMemo, useRef, useState } from "react";
import { CellInput } from "../components/Cell";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { column, digits, emptyCells, initialPossibilities } from "../logic";

const Home: NextPage = () => {
  const refsCellsContainer = useRef<HTMLDivElement>();
  const [input, setInput] = useLocalStorage("userInput", emptyCells);
  const fnSetInputAt = (index: number) => (value: string) => {
    const newInput = input.substr(0, index) + value + input.substr(index + 1);
    setInput(newInput);
  };
  const cells = input.split("");
  const [possibilities, setPossibilities] = useState<number[][]>(initialPossibilities);
  return (
    <div>
      <main className="flex justify-center mt-8">
        <div>
          <button onClick={() => setInput(emptyCells)}>Clear All</button>
        </div>
        <div ref={refsCellsContainer} className="grid grid-cols-9 gap-1 p-1 bg-gray-200">
          {cells.map((value: string, index: number) => (
            <CellInput
              key={index}
              index={index}
              value={value}
              possibility={possibilities[index]}
              onChange={fnSetInputAt(index)}
              navigate={(direction) => {
                const container = refsCellsContainer.current;
                if (!container) return;
                const inputs = container.querySelectorAll<HTMLInputElement>("input.cell-input");
                let i = index;
                if (direction === "ArrowUp") {
                  i = index - 9;
                  if (i < 0) i += 81;
                }
                if (direction === "ArrowDown") {
                  i = index + 9;
                  if (i >= 81) i -= 81;
                }
                if (direction === "ArrowLeft") {
                  if (column(index) === 0) {
                    i = index + 8;
                  } else {
                    i = index - 1;
                  }
                }
                if (direction === "ArrowRight") {
                  if (column(index) === 8) {
                    i = index - 8;
                  } else {
                    i = index + 1;
                  }
                }
                inputs[i].focus();
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
