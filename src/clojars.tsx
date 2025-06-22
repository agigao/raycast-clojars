import { ActionPanel, Action, List, showToast, Toast, getPreferenceValues, LocalStorage } from "@raycast/api";
import { useState, useEffect } from "react";
import { useFetch } from "@raycast/utils";

type Package = {
  jar_name: string;
  group_name: string;
  version: string;
  description: string;
  created: string;
};

type Preferences = {
  defaultFormat: "deps" | "lein";
};

const CLOJARS_API_URL = "https://clojars.org/search";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<"deps" | "lein">(preferences.defaultFormat);

  useEffect(() => {
    LocalStorage.getItem<string>("defaultFormat").then((saved) => {
      if (saved === "deps" || saved === "lein") {
        setFormat(saved);
      }
    });
  }, []);

  // Perform the API request with useFetch, only if there's a query
  const { isLoading, data, error } = useFetch<{ results: Package[] }>(
    `${CLOJARS_API_URL}?q=${encodeURIComponent(query)}&format=json`,
    {
      execute: !!query,
    },
  );

  if (error) {
    showToast(Toast.Style.Failure, "Live search failed");
  }

  return (
    <List
      searchBarPlaceholder="Search Clojure packages on Clojars..."
      onSearchTextChange={setQuery}
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Dependency Format" onChange={async (val) => {
          setFormat(val as "deps" | "lein");
          await LocalStorage.setItem("defaultFormat", val);
        }}>
          <List.Dropdown.Item title="deps.edn" value="deps" />
          <List.Dropdown.Item title="project.clj" value="lein" />
        </List.Dropdown>
      }
    >
      {(data?.results || []).map((pkg) => {
        const depsFormat = `${pkg.group_name}/${pkg.jar_name} {:mvn/version "${pkg.version}"}`;
        const leinFormat = `[${pkg.group_name}/${pkg.jar_name} "${pkg.version}"]`;
        const formattedText = format === "deps" ? depsFormat : leinFormat;

        return (
          <List.Item
            key={`${pkg.group_name}/${pkg.jar_name}`} // Combine fields for a unique key
            title={`${pkg.group_name}/${pkg.jar_name}`}
            subtitle={pkg.description}
            accessories={[{ text: `v${pkg.version}` }]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy Dependency" content={formattedText} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
