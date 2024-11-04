import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { useFetch } from "@raycast/utils";

type Package = {
  jar_name: string;
  group_name: string;
  version: string;
  description: string;
  created: string;
};

const CLOJARS_API_URL = "https://clojars.org/search";

export default function Command() {
  const [query, setQuery] = useState("");

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
    >
      {(data?.results || []).map((pkg) => {
        const formattedText = `${pkg.group_name}/${pkg.jar_name} {:mvn/version "${pkg.version}"}`;

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
