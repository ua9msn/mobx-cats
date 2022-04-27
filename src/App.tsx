import { action, computed, makeObservable, observable, flow } from "mobx";
import React, { createContext, useContext } from "react";
import { observer } from "mobx-react-lite";

import "./styles.css";

interface Cat {
  created_at: string;
  id: string;
  tags: string[];
  url: string;
}

type StoreStatus = "pending" | "error" | "fulfilled";

class GenericStore<T> {
  public data: T | null = null;
  public storeStatus: StoreStatus = "pending";
  private apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
    makeObservable(this, {
      data: observable,
      storeStatus: observable,
      load: flow
    });
    this.load();
  }

  async *load() {
    this.storeStatus = "pending";

    try {
      const response = await fetch(this.apiEndpoint, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      this.storeStatus = "fulfilled";

      this.data = yield response.json();
    } catch (E) {
      this.storeStatus = "error";
      console.log(E);
    }
  }
}

class CatStore extends GenericStore<Cat> {
  get url() {
    return "https://cataas.com" + this.data?.url;
  }
}

class ShopInfoStore {
  value = 0;

  constructor() {
    makeObservable(this, {
      value: observable,
      doubled: computed,
      inc: action
    });
  }

  get doubled() {
    return this.value * 2;
  }

  inc() {
    this.value += 1;
    console.log(this.value);
  }
}

class RootStore {
  public shopInfoStore: ShopInfoStore;
  public catStore: CatStore;

  constructor() {
    this.shopInfoStore = new ShopInfoStore();
    this.catStore = new CatStore("https://cataas.com/cat?json=true");
  }
}

const rootStore = new RootStore();
const StoreContext = createContext<RootStore | undefined>(undefined);
StoreContext.displayName = "StoreContext";

const RootStoreProvider: React.FC = ({ children }) => (
  <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
);

const AppWrapper: React.FC = ({ children }) => {
  return <RootStoreProvider>{children}</RootStoreProvider>;
};

const Children: React.FC = observer(() => {
  const ctx = useContext(StoreContext);

  // this is wrong
  const inc = action(() => {
    rootStore.shopInfoStore.value = rootStore.shopInfoStore.value + 5;
  });

  // this is correct
  //  const inc = () => {
  //    rootStore.shopInfoStore.inc();
  //  };

  const renew = () => {
    rootStore.catStore.load();
  };

  return (
    <div>
      <h1>
        {ctx?.shopInfoStore.value} {ctx?.shopInfoStore.doubled}
      </h1>
      <h1>{ctx?.catStore.data?.url}</h1>
      <button onClick={inc}>Inc</button>
      <button onClick={renew}>Renew</button>
      {ctx?.catStore.data && <img src={ctx?.catStore.url} alt="cat" />}
    </div>
  );
});

export default function App() {
  return (
    <AppWrapper>
      <Children />
    </AppWrapper>
  );
}
