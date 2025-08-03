import axios from "axios";

const ToggleManagerView = async (toggleValue = false) => {

    const result = await axios.post('/manager-view', { manager_view: toggleValue },
        { withCredentials: true });

    return result.data.manager_view;

};

export default ToggleManagerView;