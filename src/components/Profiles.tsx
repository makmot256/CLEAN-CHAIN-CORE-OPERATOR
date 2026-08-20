//component that interacts with your table
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Profiles = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) {
        console.error(error);
        if (error.code === "PGRST205") {
          setErrorMessage(
            "Missing table: profiles. Create it in Supabase SQL Editor.",
          );
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      setErrorMessage(null);
      setProfiles(data ?? []);
    };

    fetchProfiles();
  }, []);

  return (
    <>
      {errorMessage && <p>{errorMessage}</p>}
      <ul>
        {profiles.map((profile) => (
          <li key={profile.id}>{profile.username}</li>
        ))}
      </ul>
    </>
  );
};

export default Profiles;
