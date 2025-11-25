-- Function to handle status changes and update timestamps
CREATE OR REPLACE FUNCTION handle_devis_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status has changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Update responded_at if it's not already set (optional, but good practice)
        IF NEW.responded_at IS NULL THEN
            NEW.responded_at := NOW();
        END IF;

        -- Update specific timestamp based on the new status
        CASE NEW.status
            WHEN 'processing' THEN
                NEW.processed_at := NOW();
            WHEN 'completed' THEN
                NEW.completed_at := NOW();
            WHEN 'sold' THEN
                NEW.sold_at := NOW();
            WHEN 'rejected' THEN
                NEW.rejected_at := NOW();
            ELSE
                -- Do nothing for other statuses or 'pending'
        END CASE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for devis_requests table
DROP TRIGGER IF EXISTS on_devis_status_change ON public.devis_requests;
CREATE TRIGGER on_devis_status_change
    BEFORE UPDATE ON public.devis_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_devis_status_change();

-- Trigger for custom_devis_requests table
DROP TRIGGER IF EXISTS on_custom_devis_status_change ON public.custom_devis_requests;
CREATE TRIGGER on_custom_devis_status_change
    BEFORE UPDATE ON public.custom_devis_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_devis_status_change();
